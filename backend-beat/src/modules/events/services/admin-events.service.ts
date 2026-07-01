import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { DataSource, IsNull, EntityManager } from 'typeorm';
import { Event, EventStatus } from '../../../database/entities/event.entity';
import {
  EventSession,
  SessionStatus,
} from '../../../database/entities/event-session.entity';
import {
  SessionTicketType,
  TicketTypeStatus,
} from '../../../database/entities/session-ticket-type.entity';
import { SessionCategory } from '../../../database/entities/session-category.entity';
import { UserRepository } from '../../../database/repositories/user.repository';
import { EmailService } from '../../../providers/email/email.service';
import { ReviewEventDto, ReviewAction } from '../dto/review-event.dto';
import { CreateEventDto } from '../dto/create-event.dto';
import { CacheService } from '../../../providers/cache/cache.service';
import { EventMessages } from '../constants/events.constants';
import { EventValidator } from './events.validator';

@Injectable()
export class AdminEventsService {
  private readonly logger = new Logger(AdminEventsService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly emailService: EmailService,
    private readonly userRepository: UserRepository,
    private readonly cacheService: CacheService,
  ) {}

  private async invalidateEventCache(eventId: string): Promise<void> {
    this.logger.log(`[CACHE] Admin invalidating cache for eventId: ${eventId}`);
    await this.cacheService.del('public:discovery');
    await this.cacheService.del(`event:details:${eventId}`);
  }

  /**
   * Enforces strict database verification before allowing event approval.
   */
  private async validateEventApprovalDbInTx(eventId: string, manager: EntityManager) {
    await EventValidator.validateEventApprovalDb(eventId, manager);
  }

  /**
   * Reviews an event or a staged revision.
   */
  async reviewEvent(eventId: string, dto: ReviewEventDto) {
    if (dto.action === ReviewAction.REJECT && (!dto.reason || dto.reason.trim() === '')) {
      throw new BadRequestException(EventMessages.MANDATORY_REJECT_REASON);
    }

    const result = await this.dataSource.transaction(async (manager) => {
      // 1. Concurrency Control: Utilize PostgreSQL Row-Level Lock (SELECT FOR UPDATE)
      const event = await manager.findOne(Event, {
        where: { id: eventId, deletedAt: IsNull() },
        lock: { mode: 'pessimistic_write' }, // Compiles to SELECT ... FOR UPDATE
      });

      if (!event) {
        throw new NotFoundException(EventMessages.NOT_FOUND);
      }

      // Fetch the organizer user
      const organizer = await this.userRepository.findOne({
        where: { id: event.organizerId },
      });
      const organizerEmail = organizer?.email || 'organizer@example.com';

      // 2. Identify if there is a pending revision (Shadow Copy Pattern)
      const revisionIndex = event.statusLog.findIndex(
        (log: any) => log.action === 'REVISION_SUBMITTED' && log.status === 'PENDING',
      );

      if (revisionIndex !== -1) {
        // --- CASE A: REVIEWING A SHADOW COPY REVISION ---
        const revision = event.statusLog[revisionIndex] as any;
        const payload = revision.payload as CreateEventDto;

        if (dto.action === ReviewAction.APPROVE) {
          // Update revision status
          revision.status = 'APPROVED';
          revision.adminId = dto.adminId;
          revision.timestamp = Date.now();

          // Merge event metadata fields only
          event.title = payload.title.trim();
          event.description = payload.description.trim();
          
          // Append approval audit entry
          event.statusLog.push({
            action: 'APPROVED_REVISION',
            adminId: dto.adminId,
            timestamp: Date.now(),
            reason: null,
          } as any);

          const savedEvent = await manager.save(event);

          // Send approval notice
          try {
            const template = this.emailService.getEmailTemplate('event.approved', {
              title: savedEvent.title,
              publishAt: 'Live (Immediate Revision)',
            });
            await this.emailService.sendEmail(
              organizerEmail,
              template.subject,
              template.text,
              template.html,
            );
          } catch (mailErr) {
            this.logger.error(
              `Failed to send approval email: ${mailErr.message}`,
            );
          }

          return { message: 'Shadow copy revision approved and merged into live event tables.', event: savedEvent };
        } else {
          // Reject revision
          revision.status = 'REJECTED';
          revision.adminId = dto.adminId;
          revision.timestamp = Date.now();
          revision.reason = dto.reason;

          event.statusLog.push({
            action: 'REJECTED_REVISION',
            adminId: dto.adminId,
            timestamp: Date.now(),
            reason: dto.reason,
          } as any);

          const savedEvent = await manager.save(event);

          // Send rejection notice
          try {
            const template = this.emailService.getEmailTemplate('event.rejected', {
              title: savedEvent.title,
              reason: dto.reason,
            });
            await this.emailService.sendEmail(
              organizerEmail,
              template.subject,
              template.text,
              template.html,
            );
          } catch (mailErr) {
            this.logger.error(
              `Failed to send rejection email: ${mailErr.message}`,
            );
          }

          return { message: 'Shadow copy revision rejected.', event: savedEvent };
        }
      }

      // --- CASE B: REVIEWING INITIAL EVENT CONFIGURATION ---
      if (event.status !== EventStatus.PENDING_APPROVAL) {
        throw new ConflictException(EventMessages.NOT_PENDING);
      }

      if (dto.action === ReviewAction.APPROVE) {
        // Run rigorous DB check before approving
        await this.validateEventApprovalDbInTx(event.id, manager);

        event.status = EventStatus.PUBLISHED;
        
        event.statusLog.push({
          action: 'APPROVED',
          adminId: dto.adminId,
          timestamp: Date.now(),
          reason: null,
        } as any);

        event.statusLog.push({
          action: 'PUBLISHED',
          adminId: dto.adminId,
          timestamp: Date.now(),
          reason: 'Published immediately upon approval.',
        } as any);

        const savedEvent = await manager.save(event);

        // Send approval notice
        try {
          const template = this.emailService.getEmailTemplate('event.approved', {
            title: savedEvent.title,
          });
          await this.emailService.sendEmail(
            organizerEmail,
            template.subject,
            template.text,
            template.html,
          );
        } catch (mailErr) {
          this.logger.error(
            `Failed to send approval email: ${mailErr.message}`,
          );
        }

        return { message: `Event approved successfully and is now live. Status: ${savedEvent.status}`, event: savedEvent };
      } else {
        // REJECT Initial Config
        event.status = EventStatus.REJECTED;
        
        event.statusLog.push({
          action: 'REJECTED',
          adminId: dto.adminId,
          timestamp: Date.now(),
          reason: dto.reason,
        } as any);

        const savedEvent = await manager.save(event);

        // Send rejection notice
        try {
          const template = this.emailService.getEmailTemplate('event.rejected', {
            title: savedEvent.title,
            reason: dto.reason,
          });
          await this.emailService.sendEmail(
            organizerEmail,
            template.subject,
            template.text,
            template.html,
          );
        } catch (mailErr) {
          this.logger.error(
            `Failed to send rejection email: ${mailErr.message}`,
          );
        }

        return { message: 'Event review rejected. Event unlocked for editing.', event: savedEvent };
      }
    });

    await this.invalidateEventCache(eventId);
    return result;
  }

  /**
   * Emergency Cancellation of a live show (Explicit Administrative Termination).
   * Ticket sales close instantly.
   */
  async cancelEvent(eventId: string, adminId: string, reason: string) {
    if (!reason || reason.trim() === '') {
      throw new BadRequestException(EventMessages.MANDATORY_CANCEL_REASON);
    }

    const result = await this.dataSource.transaction(async (manager) => {
      const event = await manager.findOne(Event, {
        where: { id: eventId, deletedAt: IsNull() },
        lock: { mode: 'pessimistic_write' },
      });

      if (!event) {
        throw new NotFoundException(EventMessages.NOT_FOUND);
      }

      event.status = EventStatus.CANCELLED;
      event.statusLog.push({
        action: 'CANCELLED',
        adminId,
        timestamp: Date.now(),
        reason,
      } as any);

      const savedEvent = await manager.save(event);

      // Update operational sessions statuses to CANCELLED
      const sessions = await manager.find(EventSession, {
        where: { eventId, deletedAt: IsNull() },
      });

      for (const session of sessions) {
        session.status = SessionStatus.CANCELLED;
        await manager.save(session);
      }

      // Fetch the organizer
      const organizer = await this.userRepository.findOne({
        where: { id: event.organizerId },
      });

      if (organizer) {
        try {
          const template = this.emailService.getEmailTemplate('event.rejected', {
            title: savedEvent.title,
            reason: `EMERGENCY TERMINATION: ${reason}`,
          });
          await this.emailService.sendEmail(
            organizer.email || 'organizer@example.com',
            `[CANCELLED] ${template.subject}`,
            template.text,
            template.html,
          );
        } catch (mailErr) {
          this.logger.error(`Failed to send cancellation notification: ${mailErr.message}`);
        }
      }

      return { message: 'Event and all associated sessions cancelled immediately.', event: savedEvent };
    });

    await this.invalidateEventCache(eventId);
    return result;
  }
}
