import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { DataSource, IsNull, In, Not } from 'typeorm';
import { ulid } from 'ulid';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { SearchService } from '../../search/services/search.service';
import { Event, EventStatus } from '../../../database/entities/event.entity';
import { User } from '../../../database/entities/user.entity';
import {
  EventSession,
  SessionStatus,
  SessionMode,
} from '../../../database/entities/event-session.entity';
import {
  SessionTicketType,
  TicketTypeStatus,
} from '../../../database/entities/session-ticket-type.entity';
import { SessionCategory } from '../../../database/entities/session-category.entity';
import { EventCategory } from '../../../database/entities/event-category.entities';
import { EmailService } from '../../../providers/email/email.service';
import { CreateEventDto, LocationDto, EventAddressDto } from '../dto/create-event.dto';
import { UpdateEventDto } from '../dto/update-event.dto';
import { CreateEventSessionDto } from '../dto/create-session.dto';
import { ReviewEventDto, ReviewAction } from '../dto/review-event.dto';
import { CacheService } from '../../../providers/cache/cache.service';
import { EventRepository } from '../../../database/repositories/event.repository';
import { EventSessionRepository } from '../../../database/repositories/event-session.repository';
import { SessionTicketTypeRepository } from '../../../database/repositories/session-ticket-type.repository';
import { EventMessages, EventConstants } from '../constants/events.constants';
import { EventValidator } from './events.validator';
import { EventsHelper } from '../helpers/events.helper';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly emailService: EmailService,
    private readonly eventRepository: EventRepository,
    private readonly eventSessionRepository: EventSessionRepository,
    private readonly sessionTicketTypeRepository: SessionTicketTypeRepository,
    private readonly cacheService: CacheService,
    private readonly eventsHelper: EventsHelper,
    private readonly searchService: SearchService,
    @InjectQueue('search-sync') private readonly searchSyncQueue: Queue,
    @InjectQueue('search-analytics') private readonly searchAnalyticsQueue: Queue,
  ) {}

  /**
   * Enforces active invalidation of event details and discovery cache.
   */
  async invalidateEventCache(eventId?: string): Promise<void> {
    this.logger.log(`[CACHE] Invalidating cache for eventId: ${eventId || 'all'}`);
    await this.cacheService.deleteByPrefix('public:discovery:');
    if (eventId) {
      await this.cacheService.del(`event:details:${eventId}`);
    }
  }

  /**
   * Validates a single session's temporal, capacity, and marketing properties.
   */
  validateSessionPayload(session: CreateEventSessionDto, isUpdate = false) {
    EventValidator.validateSessionPayload(session, isUpdate);
  }

  /**
   * Enforces strict business validations on all database stored sessions for an event.
   */
  async validateEventApprovalDb(eventId: string) {
    await EventValidator.validateEventApprovalDb(eventId, this.dataSource.manager);
  }

  /**
   * Creates a new event shell with metadata (defaults to DRAFT).
   */
  async createEvent(dto: CreateEventDto, organizerId: string) {
    const result = await this.dataSource.transaction(async (manager) => {
      const event = new Event();
      event.id = ulid();
      event.organizerId = organizerId;
      event.title = dto.title.trim();
      event.slug = dto.slug ? dto.slug.trim() : this.slugify(dto.title);
      event.description = dto.description.trim();
      event.status = EventStatus.DRAFT;
      event.statusLog = [];

      // Verify slug uniqueness
      const existingSlug = await manager.findOne(Event, {
        where: { slug: event.slug, deletedAt: IsNull() },
      });
      if (existingSlug) {
        event.slug = `${event.slug}-${event.id.substring(0, 6)}`;
      }

      return await manager.save(event);
    });

    await this.invalidateEventCache();
    await this.searchSyncQueue.add('upsert-event', { eventId: result.id });
    return result;
  }

  /**
   * Updates an existing event shell.
   */
  async updateEvent(id: string, dto: UpdateEventDto, organizerId: string) {
    const event = await this.eventRepository.findById(id);

    if (!event) {
      throw new NotFoundException(EventMessages.NOT_FOUND);
    }

    if (event.organizerId !== organizerId) {
      throw new ForbiddenException(EventMessages.FORBIDDEN_UPDATE);
    }

    if (event.status === EventStatus.PENDING_APPROVAL) {
      throw new ConflictException(EventMessages.LOCKED);
    }

    // --- SHADOW COPY PATTERN FOR PUBLISHED EVENTS ---
    if (event.status === EventStatus.PUBLISHED) {
      const revisionEntry = {
        action: 'REVISION_SUBMITTED',
        adminId: '',
        timestamp: Date.now(),
        reason: 'Event modification layout submitted for approval.',
        status: 'PENDING',
        payload: dto,
      };

      if (!event.statusLog) {
        event.statusLog = [];
      }
      event.statusLog.push(revisionEntry as any);

      await this.eventRepository.save(event);

      // Notify admin team
      try {
        const details = await this.buildEventDetailsHtml(event.id);
        const orgUser = await this.dataSource.getRepository(User).findOne({
          where: { id: organizerId },
        });
        const organizerDisplayName =
          orgUser?.fullName && orgUser.fullName.trim() !== ''
            ? orgUser.fullName.trim()
            : organizerId;

        await this.eventsHelper.sendEmailToAdmins('event.submitted', {
          title: event.title,
          organizerId: organizerDisplayName,
          submitType: 'Shadow Copy Modification Revision',
          details,
          eventId: event.id,
        });
      } catch (mailErr) {
        this.logger.error(
          `Failed to send revision submission email: ${mailErr.message}`,
        );
      }

      await this.invalidateEventCache(id);

      return {
        message:
          'Your modifications have been staged and submitted to the Admin Management Team. The live show continues running uninterrupted.',
        eventId: event.id,
      };
    }

    // --- DIRECT EDIT FOR DRAFT / REJECTED SHOWS ---
    const result = await this.dataSource.transaction(async (manager) => {
      const txEvent = await manager.findOne(Event, {
        where: { id },
      });

      if (!txEvent) {
        throw new NotFoundException(EventMessages.NOT_FOUND);
      }

      // Re-verify authorization and lock state inside transaction context to prevent race conditions
      if (txEvent.organizerId !== organizerId) {
        throw new ForbiddenException(EventMessages.FORBIDDEN_UPDATE);
      }
      if (txEvent.status === EventStatus.PENDING_APPROVAL || txEvent.status === EventStatus.PUBLISHED) {
        throw new ConflictException(EventMessages.LOCKED);
      }

      if (dto.title !== undefined) {
        txEvent.title = dto.title.trim();
      }
      if (dto.description !== undefined) {
        txEvent.description = dto.description.trim();
      }

      // Simplified slug-generation and collision checks
      let targetSlug: string | undefined;
      if (dto.title !== undefined && dto.slug === undefined) {
        targetSlug = this.slugify(dto.title);
      } else if (dto.slug !== undefined) {
        targetSlug = dto.slug.trim();
      }

      if (targetSlug !== undefined) {
        txEvent.slug = targetSlug;
        const existingSlug = await manager.findOne(Event, {
          where: { slug: txEvent.slug, deletedAt: IsNull() },
        });
        if (existingSlug && existingSlug.id !== txEvent.id) {
          txEvent.slug = `${txEvent.slug}-${txEvent.id.substring(0, 6)}`;
        }
      }

      return await manager.save(txEvent);
    });

    await this.invalidateEventCache(id);
    await this.searchSyncQueue.add('upsert-event', { eventId: id });
    return result;
  }

  /**
   * Submits an event and its database sessions for administrative review.
   */
  async submitEvent(id: string, organizerId: string) {
    const event = await this.eventRepository.findById(id);

    if (!event) {
      throw new NotFoundException(EventMessages.NOT_FOUND);
    }

    if (event.organizerId !== organizerId) {
      throw new ForbiddenException('Only the organizer of this event can submit it.');
    }

    if (event.status === EventStatus.PENDING_APPROVAL) {
      throw new ConflictException('Event is already pending administrative review.');
    }

    if (event.status === EventStatus.PUBLISHED) {
      throw new ConflictException('Event is already live and published.');
    }

    // Rigorous database check of all sessions and ticket types
    await this.validateEventApprovalDb(id);

    event.status = EventStatus.PENDING_APPROVAL;
    if (!event.statusLog) {
      event.statusLog = [];
    }
    event.statusLog.push({
      action: 'SUBMITTED',
      adminId: '',
      timestamp: Date.now(),
      reason: 'Event submitted for review via submit API.',
    });

    const savedEvent = await this.eventRepository.save(event);

    // Alert admin team
    try {
      const details = await this.buildEventDetailsHtml(savedEvent.id);
      const orgUser = await this.dataSource.getRepository(User).findOne({
        where: { id: organizerId },
      });
      const organizerDisplayName =
        orgUser?.fullName && orgUser.fullName.trim() !== ''
          ? orgUser.fullName.trim()
          : organizerId;

      await this.eventsHelper.sendEmailToAdmins('event.submitted', {
        title: savedEvent.title,
        organizerId: organizerDisplayName,
        submitType: 'Event Dedicated Submission',
        details,
        eventId: savedEvent.id,
      });
    } catch (mailErr) {
      this.logger.error(
        `Failed to send email to admin: ${mailErr.message}`,
      );
    }

    await this.invalidateEventCache(id);
    await this.searchSyncQueue.add('upsert-event', { eventId: savedEvent.id });
    return savedEvent;
  }

  /**
   * Organizer deletes their own event (Soft Delete strategy).
   */
  async softDeleteEvent(id: string, organizerId: string) {
    const event = await this.eventRepository.findById(id);

    if (!event) {
      throw new NotFoundException(EventMessages.NOT_FOUND);
    }

    if (event.organizerId !== organizerId) {
      throw new ForbiddenException(EventMessages.FORBIDDEN_DELETE);
    }

    event.deletedAt = Date.now();
    await this.eventRepository.save(event);

    await this.invalidateEventCache(id);
    await this.searchSyncQueue.add('delete-event', { eventId: id });
    return { message: EventMessages.DELETED };
  }

  // ==========================================
  // SESSION CRUD OPERATIONS
  // ==========================================

  /**
   * Adds a new session to an existing event.
   */
  async createSession(eventId: string, dto: CreateEventSessionDto, organizerId: string) {
    const event = await this.eventRepository.findById(eventId);
    if (!event) {
      throw new NotFoundException(EventMessages.NOT_FOUND);
    }
    if (event.organizerId !== organizerId) {
      throw new ForbiddenException('Only the organizer of this event can manage sessions.');
    }
    if (event.status === EventStatus.PENDING_APPROVAL) {
      throw new ConflictException('Event is locked for administrative review.');
    }

    // Defensive normalization to ensure ticketTypes is an array if provided
    if (dto.ticketTypes !== undefined && !Array.isArray(dto.ticketTypes)) {
      if (typeof dto.ticketTypes === 'string') {
        try {
          dto.ticketTypes = JSON.parse(dto.ticketTypes);
        } catch (e) {}
      }
      if (dto.ticketTypes && typeof dto.ticketTypes === 'object' && !Array.isArray(dto.ticketTypes)) {
        const keys = Object.keys(dto.ticketTypes);
        const isIndexKeyed = keys.every((k) => !isNaN(Number(k)));
        if (isIndexKeyed) {
          dto.ticketTypes = keys
            .sort((a, b) => Number(a) - Number(b))
            .map((key) => (dto.ticketTypes as any)[key]);
        } else {
          dto.ticketTypes = [dto.ticketTypes];
        }
      }
      if (!Array.isArray(dto.ticketTypes)) {
        dto.ticketTypes = [dto.ticketTypes].filter(Boolean) as any;
      }
    }

    this.validateSessionPayload(dto);

    const result = await this.dataSource.transaction(async (manager) => {
      // Check categories existence
      if (!dto.categoryIds || dto.categoryIds.length === 0) {
        throw new BadRequestException('At least one category is required for a session.');
      }
      const activeCategories = await manager.createQueryBuilder(EventCategory, 'category')
        .where('category.id IN (:...ids)', { ids: dto.categoryIds })
        .andWhere('category.is_deleted = :isDeleted', { isDeleted: false })
        .getMany();

      if (activeCategories.length !== dto.categoryIds.length) {
        throw new NotFoundException(EventMessages.CATEGORY_NOT_FOUND);
      }

      const session = new EventSession();
      session.id = ulid();
      session.eventId = eventId;
      session.title = dto.title?.trim() || undefined;
      session.startAt = dto.startAt;
      session.endAt = dto.endAt;
      session.location = {
        type: 'Point',
        coordinates: [dto.location.longitude, dto.location.latitude],
      };
      session.eventAddress = dto.eventAddress;
      session.capacity = dto.capacity;
      session.ageRestriction = (dto.ageRestriction as any) || undefined;
      session.languages = dto.languages || [];
      session.eventSessionMedias = dto.eventSessionMedias || {};
      session.mode = (dto.mode as any) || undefined;
      session.ticketSaleStartAt = dto.ticketSaleStartAt;
      session.ticketSaleEndAt = dto.ticketSaleEndAt;
      session.allowReferral = !!dto.allowReferral;
      session.referralRewardPerTicket = dto.referralRewardPerTicket || undefined;
      session.allowPromoters = !!dto.allowPromoters;
      session.promoterCommissionPercentage = dto.promoterCommissionPercentage || undefined;
      session.priorityWeight = dto.priority ? Math.floor(Date.now() / 1000) : undefined;
      session.priorityExpiresAt = dto.priorityExpiresAt || undefined;
      session.artistMetadata = dto.artistMetadata || undefined;
      session.status = SessionStatus.ACTIVE;

      const savedSession = await manager.save(session);

      // Auto map category relations
      for (const catId of dto.categoryIds) {
        const sessionCategory = new SessionCategory();
        sessionCategory.sessionId = savedSession.id;
        sessionCategory.categoryId = catId;
        await manager.save(sessionCategory);
      }

      // Save ticket types
      const savedTicketTypes: SessionTicketType[] = [];
      for (const tDto of dto.ticketTypes) {
        const tType = new SessionTicketType();
        tType.id = ulid();
        tType.sessionId = savedSession.id;
        tType.name = tDto.name.trim();
        tType.description = tDto.description?.trim() || undefined;
        tType.price = tDto.price;
        tType.quantity = tDto.quantity;
        tType.maxPurchaseLimit = tDto.maxPurchaseLimit ?? 10;
        tType.saleStartAt = tDto.saleStartAt;
        tType.saleEndAt = tDto.saleEndAt;
        tType.status = TicketTypeStatus.ACTIVE;

        const savedTicket = await manager.save(tType);
        savedTicketTypes.push(savedTicket);
      }

      savedSession['ticketTypes'] = savedTicketTypes;
      return savedSession;
    });

    await this.invalidateEventCache(eventId);
    await this.searchSyncQueue.add('upsert-event', { eventId });
    return result;
  }

  /**
   * Updates an existing session and its ticket types.
   */
  async updateSession(
    eventId: string,
    sessionId: string,
    dto: CreateEventSessionDto,
    organizerId: string,
  ) {
    const event = await this.eventRepository.findById(eventId);
    if (!event) {
      throw new NotFoundException(EventMessages.NOT_FOUND);
    }
    if (event.organizerId !== organizerId) {
      throw new ForbiddenException('Only the organizer of this event can manage sessions.');
    }
    if (event.status === EventStatus.PENDING_APPROVAL) {
      throw new ConflictException('Event is locked for administrative review.');
    }

    const session = await this.eventSessionRepository.findOne({
      where: { id: sessionId, eventId, deletedAt: IsNull() },
    });
    if (!session) {
      throw new NotFoundException('Session not found or deleted.');
    }

    // Defensive normalization to ensure ticketTypes is an array if provided
    if (dto.ticketTypes !== undefined && !Array.isArray(dto.ticketTypes)) {
      if (typeof dto.ticketTypes === 'string') {
        try {
          dto.ticketTypes = JSON.parse(dto.ticketTypes);
        } catch (e) {}
      }
      if (dto.ticketTypes && typeof dto.ticketTypes === 'object' && !Array.isArray(dto.ticketTypes)) {
        const keys = Object.keys(dto.ticketTypes);
        const isIndexKeyed = keys.every((k) => !isNaN(Number(k)));
        if (isIndexKeyed) {
          dto.ticketTypes = keys
            .sort((a, b) => Number(a) - Number(b))
            .map((key) => (dto.ticketTypes as any)[key]);
        } else {
          dto.ticketTypes = [dto.ticketTypes];
        }
      }
      if (!Array.isArray(dto.ticketTypes)) {
        dto.ticketTypes = [dto.ticketTypes].filter(Boolean) as any;
      }
    }

    // Load existing category associations to merge
    const sessionCategories = await this.dataSource.getRepository(SessionCategory).find({
      where: { sessionId },
    });
    const existingCategoryIds = sessionCategories.map((sc) => sc.categoryId);

    // Load existing active ticket types to merge
    const sessionTickets = await this.dataSource.getRepository(SessionTicketType).find({
      where: { sessionId, status: TicketTypeStatus.ACTIVE },
    });
    const existingTicketTypesDto = sessionTickets.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description || undefined,
      price: Number(t.price),
      quantity: t.quantity,
      maxPurchaseLimit: t.maxPurchaseLimit,
      saleStartAt: Number(t.saleStartAt),
      saleEndAt: Number(t.saleEndAt),
    }));

    // Build merged DTO structure for validation
    const mergedDto: CreateEventSessionDto = {
      id: sessionId,
      categoryIds: dto.categoryIds !== undefined ? dto.categoryIds : existingCategoryIds,
      title: dto.title !== undefined ? dto.title : session.title,
      startAt: dto.startAt !== undefined ? dto.startAt : Number(session.startAt),
      endAt: dto.endAt !== undefined ? dto.endAt : Number(session.endAt),
      location: (dto.location !== undefined ? dto.location : (session.location?.coordinates ? { longitude: session.location.coordinates[0], latitude: session.location.coordinates[1] } : { longitude: 0, latitude: 0 })) as LocationDto,
      eventAddress: (dto.eventAddress !== undefined ? dto.eventAddress : session.eventAddress) as EventAddressDto,
      capacity: dto.capacity !== undefined ? dto.capacity : session.capacity,
      ageRestriction: dto.ageRestriction !== undefined ? dto.ageRestriction : session.ageRestriction,
      languages: dto.languages !== undefined ? dto.languages : session.languages,
      eventSessionMedias: dto.eventSessionMedias !== undefined ? dto.eventSessionMedias : session.eventSessionMedias,
      mode: dto.mode !== undefined ? dto.mode : session.mode,
      ticketSaleStartAt: dto.ticketSaleStartAt !== undefined ? dto.ticketSaleStartAt : Number(session.ticketSaleStartAt),
      ticketSaleEndAt: dto.ticketSaleEndAt !== undefined ? dto.ticketSaleEndAt : Number(session.ticketSaleEndAt),
      allowReferral: dto.allowReferral !== undefined ? dto.allowReferral : session.allowReferral,
      referralRewardPerTicket: dto.referralRewardPerTicket !== undefined ? dto.referralRewardPerTicket : session.referralRewardPerTicket,
      allowPromoters: dto.allowPromoters !== undefined ? dto.allowPromoters : session.allowPromoters,
      promoterCommissionPercentage: dto.promoterCommissionPercentage !== undefined ? dto.promoterCommissionPercentage : session.promoterCommissionPercentage,
      priority: dto.priority !== undefined ? dto.priority : !!session.priorityWeight,
      priorityExpiresAt: dto.priorityExpiresAt !== undefined ? dto.priorityExpiresAt : Number(session.priorityExpiresAt),
      artistMetadata: dto.artistMetadata !== undefined ? dto.artistMetadata : session.artistMetadata,
      ticketTypes: dto.ticketTypes !== undefined ? dto.ticketTypes : existingTicketTypesDto,
    };

    this.validateSessionPayload(mergedDto, true);

    const result = await this.dataSource.transaction(async (manager) => {
      // Validate categories if they are being updated
      const categoryIdsToUse = dto.categoryIds !== undefined ? dto.categoryIds : existingCategoryIds;
      if (!categoryIdsToUse || categoryIdsToUse.length === 0) {
        throw new BadRequestException('At least one category is required for a session.');
      }

      if (dto.categoryIds !== undefined) {
        const activeCategories = await manager.createQueryBuilder(EventCategory, 'category')
          .where('category.id IN (:...ids)', { ids: dto.categoryIds })
          .andWhere('category.is_deleted = :isDeleted', { isDeleted: false })
          .getMany();

        if (activeCategories.length !== dto.categoryIds.length) {
          throw new NotFoundException(EventMessages.CATEGORY_NOT_FOUND);
        }
      }

      session.title = dto.title !== undefined ? (dto.title?.trim() || undefined) : session.title;
      session.startAt = dto.startAt !== undefined ? dto.startAt : session.startAt;
      session.endAt = dto.endAt !== undefined ? dto.endAt : session.endAt;
      if (dto.location !== undefined) {
        session.location = {
          type: 'Point',
          coordinates: [dto.location.longitude, dto.location.latitude],
        };
      }
      session.eventAddress = dto.eventAddress !== undefined ? dto.eventAddress : session.eventAddress;
      session.capacity = dto.capacity !== undefined ? dto.capacity : session.capacity;
      session.ageRestriction = dto.ageRestriction !== undefined ? ((dto.ageRestriction as any) || undefined) : session.ageRestriction;
      session.languages = dto.languages !== undefined ? (dto.languages || []) : session.languages;
      session.eventSessionMedias = dto.eventSessionMedias !== undefined ? (dto.eventSessionMedias || {}) : session.eventSessionMedias;
      session.mode = dto.mode !== undefined ? ((dto.mode as any) || undefined) : session.mode;
      session.ticketSaleStartAt = dto.ticketSaleStartAt !== undefined ? dto.ticketSaleStartAt : session.ticketSaleStartAt;
      session.ticketSaleEndAt = dto.ticketSaleEndAt !== undefined ? dto.ticketSaleEndAt : session.ticketSaleEndAt;
      session.allowReferral = dto.allowReferral !== undefined ? !!dto.allowReferral : session.allowReferral;
      session.referralRewardPerTicket = dto.referralRewardPerTicket !== undefined ? (dto.referralRewardPerTicket || undefined) : session.referralRewardPerTicket;
      session.allowPromoters = dto.allowPromoters !== undefined ? !!dto.allowPromoters : session.allowPromoters;
      session.promoterCommissionPercentage = dto.promoterCommissionPercentage !== undefined ? (dto.promoterCommissionPercentage || undefined) : session.promoterCommissionPercentage;
      session.priorityWeight = dto.priority !== undefined ? (dto.priority ? Math.floor(Date.now() / 1000) : undefined) : session.priorityWeight;
      session.priorityExpiresAt = dto.priorityExpiresAt !== undefined ? (dto.priorityExpiresAt || undefined) : session.priorityExpiresAt;
      session.artistMetadata = dto.artistMetadata !== undefined ? (dto.artistMetadata || undefined) : session.artistMetadata;

      const savedSession = await manager.save(session);

      // Only update category map if categories are explicitly provided in the update payload
      if (dto.categoryIds !== undefined) {
        await manager.delete(SessionCategory, { sessionId: savedSession.id });
        for (const catId of dto.categoryIds) {
          const sessionCategory = new SessionCategory();
          sessionCategory.sessionId = savedSession.id;
          sessionCategory.categoryId = catId;
          await manager.save(sessionCategory);
        }
      }

      // Sync pricing tiers (ticket types) if they are explicitly provided in the update payload
      const savedTicketTypes: SessionTicketType[] = [];
      if (dto.ticketTypes !== undefined) {
        const existingTickets = await manager.find(SessionTicketType, {
          where: { sessionId: savedSession.id },
        });

        const payloadTicketIds = dto.ticketTypes.map((t) => t.id).filter(Boolean);

        // Soft-delete omitted pricing tiers
        const ticketsToSoftDelete = existingTickets.filter(
          (et) => !payloadTicketIds.includes(et.id),
        );
        for (const et of ticketsToSoftDelete) {
          et.status = TicketTypeStatus.INACTIVE;
          await manager.save(et);
        }

        // Update / Save new ticket types
        for (const tDto of dto.ticketTypes) {
          let ticket: SessionTicketType;

          if (tDto.id) {
            const found = existingTickets.find((et) => et.id === tDto.id);
            if (!found) {
              throw new BadRequestException('Invalid ticket type identifier.');
            }
            ticket = found;
          } else {
            if (!tDto.name || tDto.price === undefined || tDto.quantity === undefined || tDto.saleStartAt === undefined || tDto.saleEndAt === undefined) {
              throw new BadRequestException('New ticket types require name, price, quantity, saleStartAt, and saleEndAt.');
            }
            ticket = new SessionTicketType();
            ticket.id = ulid();
            ticket.sessionId = savedSession.id;
          }

          ticket.name = tDto.name !== undefined ? tDto.name.trim() : ticket.name;
          ticket.description = tDto.description !== undefined ? (tDto.description?.trim() || undefined) : ticket.description;
          ticket.price = tDto.price !== undefined ? tDto.price : ticket.price;
          ticket.quantity = tDto.quantity !== undefined ? tDto.quantity : ticket.quantity;
          ticket.maxPurchaseLimit = tDto.maxPurchaseLimit !== undefined ? (tDto.maxPurchaseLimit ?? 10) : (ticket.maxPurchaseLimit ?? 10);
          ticket.saleStartAt = tDto.saleStartAt !== undefined ? tDto.saleStartAt : ticket.saleStartAt;
          ticket.saleEndAt = tDto.saleEndAt !== undefined ? tDto.saleEndAt : ticket.saleEndAt;
          ticket.status = TicketTypeStatus.ACTIVE;

          const savedTicket = await manager.save(ticket);
          savedTicketTypes.push(savedTicket);
        }

      } else {
        // Load active ones to return
        const activeTickets = await manager.find(SessionTicketType, {
          where: { sessionId: savedSession.id, status: TicketTypeStatus.ACTIVE },
        });
        savedTicketTypes.push(...activeTickets);
      }

      savedSession['ticketTypes'] = savedTicketTypes;
      return savedSession;
    });

    await this.invalidateEventCache(eventId);
    await this.searchSyncQueue.add('upsert-event', { eventId });
    return result;
  }

  /**
   * Soft deletes a specific event session and its ticket types.
   */
  async deleteSession(eventId: string, sessionId: string, organizerId: string) {
    const event = await this.eventRepository.findById(eventId);
    if (!event) {
      throw new NotFoundException(EventMessages.NOT_FOUND);
    }
    if (event.organizerId !== organizerId) {
      throw new ForbiddenException('Only the organizer of this event can manage sessions.');
    }
    if (event.status === EventStatus.PENDING_APPROVAL) {
      throw new ConflictException('Event is locked for administrative review.');
    }

    const session = await this.eventSessionRepository.findOne({
      where: { id: sessionId, eventId, deletedAt: IsNull() },
    });
    if (!session) {
      throw new NotFoundException('Session not found.');
    }

    await this.dataSource.transaction(async (manager) => {
      session.deletedAt = Date.now();
      session.status = SessionStatus.CANCELLED;
      await manager.save(session);

      // Inactivate ticket types
      const tickets = await manager.find(SessionTicketType, {
        where: { sessionId: session.id },
      });
      for (const t of tickets) {
        t.status = TicketTypeStatus.INACTIVE;
        await manager.save(t);
      }
    });

    await this.invalidateEventCache(eventId);
    await this.searchSyncQueue.add('delete-session', { sessionId });
    return { message: 'Session deleted successfully.' };
  }

  /**
   * Lists all active sessions for a specific event.
   */
  async getEventSessions(
    eventId: string,
    options?: {
      search?: string;
      mode?: SessionMode;
      status?: SessionStatus;
      limit?: number;
      offset?: number;
    },
  ) {
    const queryBuilder = this.eventSessionRepository
      .createQueryBuilder('session')
      .where('session.eventId = :eventId', { eventId })
      .andWhere('session.deletedAt IS NULL');

    if (options?.mode) {
      queryBuilder.andWhere('session.mode = :mode', { mode: options.mode });
    }

    if (options?.status) {
      queryBuilder.andWhere('session.status = :status', { status: options.status });
    }

    if (options?.search && options.search.trim()) {
      const searchTerm = `%${options.search.trim().toLowerCase()}%`;
      queryBuilder.andWhere(
        '(LOWER(session.title) LIKE :searchTerm OR ' +
        'LOWER(session.event_address->>\'city\') LIKE :searchTerm OR ' +
        'LOWER(session.event_address->>\'venueName\') LIKE :searchTerm OR ' +
        'LOWER(session.event_address->>\'formattedAddress\') LIKE :searchTerm OR ' +
        'LOWER(session.artist_metadata::text) LIKE :searchTerm)',
        { searchTerm }
      );
    }

    queryBuilder.orderBy('session.priorityWeight', 'DESC')
                .addOrderBy('session.startAt', 'ASC');

    if (options?.limit !== undefined) {
      queryBuilder.take(options.limit);
    }
    if (options?.offset !== undefined) {
      queryBuilder.skip(options.offset);
    }

    const sessions = await queryBuilder.getMany();

    for (const session of sessions) {
      session['ticketTypes'] = await this.sessionTicketTypeRepository.findTicketsBySessionId(session.id);
    }
    return sessions;
  }

  // ==========================================
  // PUBLIC QUERIES
  // ==========================================

  /**
   * Retrieves an event by ID with its categories, sessions, and ticket types.
   */
  async getEventDetails(id: string) {
    const cacheKey = `event:details:${id}`;
    const cached = await this.cacheService.get<any>(cacheKey);
    if (cached) {
      this.logger.log(`[CACHE] Hit for event details: ${id}`);
      return cached;
    }

    this.logger.log(`[CACHE] Miss for event details: ${id}`);
    const event = await this.eventRepository.findById(id);

    if (!event) {
      throw new NotFoundException(EventMessages.NOT_FOUND);
    }

    // Retrieve active sessions via repository method
    const sessions = await this.eventSessionRepository.findSessionsByEventId(event.id);

    // Populate tickets and categories
    for (const session of sessions) {
      session['ticketTypes'] = await this.sessionTicketTypeRepository.findTicketsBySessionId(session.id);

      // Find categories
      const scs = await this.dataSource.getRepository(SessionCategory).find({
        where: { sessionId: session.id },
        relations: { category: true },
      });
      session['categories'] = scs.map((sc) => sc.category).filter(Boolean);
    }

    event['sessions'] = sessions;

    // Cache event details for 10 seconds (using EventConstants TTL)
    await this.cacheService.set(cacheKey, event, EventConstants.DETAILS_CACHE_TTL_MS);
    return event;
  }

  async getPublicDiscoveryEvents(
    limit: number = 10,
    offset: number = 0,
    search?: string,
    city?: string,
    category?: string,
    dateFrom?: number,
    dateTo?: number,
    language?: string,
    lat?: number,
    lng?: number,
    radius?: string,
  ) {
    const hasSearchParams = !!(
      search ||
      city ||
      category ||
      dateFrom ||
      dateTo ||
      language ||
      (lat !== undefined && lng !== undefined)
    );

    if (!hasSearchParams) {
      const cacheKey = `public:discovery:${limit}:${offset}`;
      const cached = await this.cacheService.get<any>(cacheKey);
      if (cached) {
        this.logger.log(`[CACHE] Hit for public discovery feed (limit: ${limit}, offset: ${offset})`);
        return cached;
      }

      this.logger.log(`[CACHE] Miss for public discovery feed (limit: ${limit}, offset: ${offset})`);
      const total = await this.countLivePublishedEvents();
      const events = await this.eventRepository.findLivePublishedEvents(limit, offset);

      const output = await this.enrichEventsWithActiveSessions(events);

      const resultShape = {
        data: output,
        pagination: {
          total,
          limit,
          offset,
        },
      };

      await this.cacheService.set(cacheKey, resultShape, EventConstants.DISCOVERY_CACHE_TTL_MS);
      return resultShape;
    }

    // Process search keyword tracking asynchronously
    if (search && search.trim()) {
      const normalized = search.trim().toLowerCase();
      if (normalized) {
        await this.searchAnalyticsQueue.add('track-search', { query: normalized }).catch((err) => {
          this.logger.error('Failed to queue track-search analytics job', err);
        });
      }
    }

    let searchResult: any;
    let fallback = false;

    try {
      searchResult = await this.searchService.search({
        query: search,
        city,
        category,
        dateFrom,
        dateTo,
        language,
        lat,
        lng,
        radius,
        limit,
        offset,
      });
    } catch (error) {
      this.logger.error('OpenSearch search failed, falling back to PostgreSQL discovery', error);
      fallback = true;
    }

    if (fallback) {
      const total = await this.countLivePublishedEvents();
      const events = await this.eventRepository.findLivePublishedEvents(limit, offset);

      const output = await this.enrichEventsWithActiveSessions(events);

      return {
        data: output,
        pagination: {
          total,
          limit,
          offset,
        },
      };
    }

    const hits = searchResult.hits;
    const total = searchResult.total;

    if (hits.length === 0) {
      return {
        data: [],
        pagination: {
          total,
          limit,
          offset,
        },
      };
    }

    const sessionIds = hits.map((h: any) => h.sessionId);
    const eventIds = Array.from(new Set(hits.map((h: any) => h.eventId) as string[]));

    const rawSessions = await this.eventSessionRepository.find({
      where: { id: In(sessionIds) },
    });

    const rawEvents = await this.eventRepository.find({
      where: { id: In(eventIds) },
    });

    const ticketTypesList = await this.sessionTicketTypeRepository.find({
      where: {
        sessionId: In(sessionIds),
        status: Not(TicketTypeStatus.INACTIVE),
      },
    });

    const sessionCategoriesList = await this.dataSource.getRepository(SessionCategory).find({
      where: { sessionId: In(sessionIds) },
      relations: { category: true },
    });

    const eventsMap = new Map(rawEvents.map((e) => [e.id, e]));
    const sessionsMap = new Map(rawSessions.map((s) => [s.id, s]));

    const ticketTypesMap = new Map<string, any[]>();
    for (const tt of ticketTypesList) {
      if (!ticketTypesMap.has(tt.sessionId)) {
        ticketTypesMap.set(tt.sessionId, []);
      }
      ticketTypesMap.get(tt.sessionId)!.push(tt);
    }

    const categoriesMap = new Map<string, any[]>();
    for (const sc of sessionCategoriesList) {
      if (!categoriesMap.has(sc.sessionId)) {
        categoriesMap.set(sc.sessionId, []);
      }
      if (sc.category) {
        categoriesMap.get(sc.sessionId)!.push(sc.category);
      }
    }

    const highlightsMap = new Map(hits.map((h: any) => [h.sessionId, h.highlights]));

    const orderedEvents: any[] = [];
    const eventTracker = new Set<string>();
    const eventSessionsGroup = new Map<string, any[]>();

    for (const hit of hits) {
      const session = sessionsMap.get(hit.sessionId);
      const eventObj = eventsMap.get(hit.eventId);

      if (!session || !eventObj) continue;

      session['ticketTypes'] = ticketTypesMap.get(session.id) || [];
      session['categories'] = categoriesMap.get(session.id) || [];
      
      const hg = highlightsMap.get(session.id);
      if (hg && Object.keys(hg).length > 0) {
        session['highlights'] = hg;
      }

      if (!eventTracker.has(hit.eventId)) {
        eventTracker.add(hit.eventId);
        orderedEvents.push(eventObj);
      }

      if (!eventSessionsGroup.has(hit.eventId)) {
        eventSessionsGroup.set(hit.eventId, []);
      }
      eventSessionsGroup.get(hit.eventId)!.push(session);
    }

    const data = orderedEvents.map((event) => {
      const clonedEvent = { ...event };
      delete clonedEvent.statusLog;
      clonedEvent['sessions'] = eventSessionsGroup.get(event.id) || [];
      return clonedEvent;
    });

    return {
      data,
      pagination: {
        total,
        limit,
        offset,
      },
    };
  }

  /**
   * Enriches a list of events by attaching their active sessions,
   * ticket types, and categories. Events with no active sessions are excluded.
   */
  private async enrichEventsWithActiveSessions(events: Event[]): Promise<Event[]> {
    const output: Event[] = [];
    for (const event of events) {
      delete (event as any).statusLog;
      const sessions = await this.eventSessionRepository.findActiveSessionsByEventId(event.id);

      if (sessions.length > 0) {
        for (const session of sessions) {
          session['ticketTypes'] = await this.sessionTicketTypeRepository.findActiveTicketsBySessionId(session.id);

          const scs = await this.dataSource
            .getRepository(SessionCategory)
            .find({
              where: { sessionId: session.id },
              relations: { category: true },
            });
          session['categories'] = scs.map((sc) => sc.category).filter(Boolean);
        }

        event['sessions'] = sessions;
        output.push(event);
      }
    }
    return output;
  }

  async countLivePublishedEvents(): Promise<number> {
    return this.eventRepository.createQueryBuilder('event')
      .where('event.status = :status', { status: EventStatus.PUBLISHED })
      .andWhere('event.deleted_at IS NULL')
      .andWhere((qb) => {
        const subQuery = qb
          .subQuery()
          .select('1')
          .from('event_sessions', 'session')
          .where('session.event_id = event.id')
          .andWhere('session.deleted_at IS NULL')
          .andWhere('session.status = :sessionStatus', { sessionStatus: 'ACTIVE' })
          .getQuery();
        return `EXISTS (${subQuery})`;
      })
      .getCount();
  }

  async getSuggestions(query: string): Promise<string[]> {
    return this.searchService.getSuggestions(query);
  }

  async getTrendingSearches(): Promise<string[]> {
    return this.searchService.getTrendingSearches();
  }

  /**
   * Fetch all events created by the logged-in organizer.
   */
  async getOrganizerEvents(organizerId: string) {
    return await this.eventRepository.findOrganizerEvents(organizerId);
  }

  private async buildEventDetailsHtml(eventId: string): Promise<string> {
    try {
      const event = await this.eventRepository.findById(eventId);
      if (!event) return '<div style="color: #ef4444; font-weight: bold; font-family: Arial, sans-serif;">Event metadata not found.</div>';

      let html = `
        <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 25px; font-family: Arial, sans-serif; box-shadow: 0 1px 3px rgba(0,0,0,0.02); overflow: hidden;">
          <div style="font-weight: 700; color: #1e293b; background-color: #f8fafc; padding: 10px 15px; border-bottom: 1px solid #e2e8f0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">📋 Event Shell Metadata</div>
          <div style="padding: 15px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #334155;">
              <tr>
                <td style="padding: 6px 0; font-weight: bold; width: 120px; vertical-align: top; color: #64748b;">Event ID:</td>
                <td style="padding: 6px 0; font-family: monospace; color: #0f172a; font-weight: 600;">${event.id}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: bold; vertical-align: top; color: #64748b;">URL Slug:</td>
                <td style="padding: 6px 0; font-family: monospace; color: #2563eb;">${this.escapeHtml(event.slug)}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: bold; vertical-align: top; color: #64748b;">Description:</td>
                <td style="padding: 6px 0; line-height: 1.5; color: #334155;">${this.escapeHtml(event.description)}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: bold; vertical-align: top; color: #64748b;">Current Status:</td>
                <td style="padding: 6px 0;"><span style="background-color: #dcfce7; color: #166534; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: bold; text-transform: uppercase;">${event.status}</span></td>
              </tr>
            </table>
          </div>
        </div>
      `;

      const sessions = await this.eventSessionRepository.find({
        where: { eventId: event.id, deletedAt: IsNull() },
      });

      html += `
        <div style="font-family: Arial, sans-serif; margin-top: 20px;">
          <h4 style="margin-top: 0; margin-bottom: 15px; color: #0f172a; font-size: 15px; font-weight: 800; letter-spacing: -0.3px;">🗓️ Sessions & Pricing Configuration (${sessions.length})</h4>
      `;

      for (let i = 0; i < sessions.length; i++) {
        const session = sessions[i];
        
        // Format dates
        const startStr = new Date(Number(session.startAt)).toUTCString();
        const endStr = new Date(Number(session.endAt)).toUTCString();
        const saleStartStr = new Date(Number(session.ticketSaleStartAt)).toUTCString();
        const saleEndStr = new Date(Number(session.ticketSaleEndAt)).toUTCString();

        const languagesList = session.languages?.join(', ') || 'None';
        const formattedAddress = session.eventAddress?.formattedAddress || 'N/A';
        const city = session.eventAddress?.city || '';
        const state = session.eventAddress?.state || '';
        const country = session.eventAddress?.country || '';
        const postalCode = session.eventAddress?.postalCode || '';
        const fullAddrStr = [formattedAddress, city, state, country, postalCode].filter(Boolean).join(', ');
        const coords = session.location
          ? `Lat ${session.location.coordinates[1]}, Lng ${session.location.coordinates[0]}`
          : 'N/A';

        const sessionCats = await this.dataSource.getRepository(SessionCategory).find({
          where: { sessionId: session.id },
          relations: { category: true },
        });
        const categoriesList = sessionCats.map((sc) => sc.category?.name).filter(Boolean).join(', ') || 'None';

        // Select mode badge styling
        let modeBadgeColor = 'background-color: #f1f5f9; color: #334155;';
        if (session.mode === 'ONLINE') {
          modeBadgeColor = 'background-color: #e0f2fe; color: #0369a1;';
        } else if (session.mode === 'OFFLINE') {
          modeBadgeColor = 'background-color: #dcfce7; color: #15803d;';
        } else if (session.mode === 'HYBRID') {
          modeBadgeColor = 'background-color: #fef3c7; color: #b45309;';
        }

        // Fetch tickets
        const ticketTypes = await this.sessionTicketTypeRepository.find({
          where: { sessionId: session.id, status: TicketTypeStatus.ACTIVE },
        });

        let ticketsTableHtml = '';
        if (ticketTypes.length > 0) {
          ticketsTableHtml = `
            <table style="width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 12px; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden;">
              <thead>
                <tr style="background-color: #f8fafc; text-align: left; border-bottom: 1px solid #e2e8f0;">
                  <th style="padding: 8px 10px; color: #475569; font-weight: 700; font-size: 11px; text-transform: uppercase;">Ticket Name</th>
                  <th style="padding: 8px 10px; color: #475569; font-weight: 700; font-size: 11px; text-transform: uppercase;">Unit Price</th>
                  <th style="padding: 8px 10px; color: #475569; font-weight: 700; font-size: 11px; text-transform: uppercase;">Capacity Allocation</th>
                  <th style="padding: 8px 10px; color: #475569; font-weight: 700; font-size: 11px; text-transform: uppercase;">Max Limit</th>
                </tr>
              </thead>
              <tbody>
          `;
          for (let j = 0; j < ticketTypes.length; j++) {
            const t = ticketTypes[j];
            const rowBg = j % 2 === 0 ? '#ffffff' : '#f8fafc';
            ticketsTableHtml += `
              <tr style="background-color: ${rowBg}; border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 8px 10px; color: #0f172a; font-weight: 600;">${this.escapeHtml(t.name)}</td>
                <td style="padding: 8px 10px; color: #16a34a; font-weight: 700; font-family: monospace; font-size: 13px;">$${(t.price / 100).toFixed(2)}</td>
                <td style="padding: 8px 10px; color: #475569; font-family: monospace;">${t.quantity} / ${session.capacity}</td>
                <td style="padding: 8px 10px; color: #475569; font-family: monospace;">${t.maxPurchaseLimit}</td>
              </tr>
            `;
          }
          ticketsTableHtml += `
              </tbody>
            </table>
          `;
        } else {
          ticketsTableHtml = `
            <div style="background-color: #fff1f2; color: #991b1b; padding: 10px 14px; border-radius: 6px; border: 1px solid #fecdd3; font-size: 12px; margin-top: 10px; font-weight: bold;">
              ⚠️ No active pricing tiers or ticket types have been configured for this session.
            </div>
          `;
        }

        html += `
          <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-top: 4px solid #4f46e5; border-radius: 8px; padding: 18px; margin-bottom: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -2px rgba(0,0,0,0.02);">
            <div style="font-size: 15px; font-weight: bold; color: #1e1b4b; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">
              <span>Session #${i + 1}: ${this.escapeHtml(session.title || 'Untitled')}</span>
              <span style="font-family: monospace; font-size: 11px; background-color: #f1f5f9; color: #475569; padding: 2px 6px; border-radius: 4px; font-weight: 500;">ID: ${session.id}</span>
            </div>
            
            <table style="width: 100%; border-collapse: collapse; font-size: 12px; color: #475569; margin-bottom: 15px;">
              <tr style="border-bottom: 1px solid #f8fafc;">
                <td style="padding: 5px 0; font-weight: bold; width: 140px; color: #64748b;">📅 Operational Time:</td>
                <td style="padding: 5px 0; color: #0f172a; font-weight: 500;">${startStr} &mdash; ${endStr}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f8fafc;">
                <td style="padding: 5px 0; font-weight: bold; color: #64748b;">📍 Venue Address:</td>
                <td style="padding: 5px 0; color: #0f172a; font-weight: 500;">${this.escapeHtml(fullAddrStr)}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f8fafc;">
                <td style="padding: 5px 0; font-weight: bold; color: #64748b;">🌐 Coordinates:</td>
                <td style="padding: 5px 0; font-family: monospace; color: #3b82f6;">${coords}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f8fafc;">
                <td style="padding: 5px 0; font-weight: bold; color: #64748b;">👥 Capacity & Mode:</td>
                <td style="padding: 5px 0; color: #0f172a; font-weight: 500;">
                  <span style="background-color: #d1fae5; color: #065f46; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: bold; margin-right: 6px;">${session.capacity} guests</span>
                  <span style="${modeBadgeColor} padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: bold;">${session.mode}</span>
                </td>
              </tr>
              <tr style="border-bottom: 1px solid #f8fafc;">
                <td style="padding: 5px 0; font-weight: bold; color: #64748b;">🔞 Age Restriction:</td>
                <td style="padding: 5px 0; color: #0f172a;">
                  <span style="background-color: #fee2e2; color: #991b1b; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: bold;">${this.escapeHtml(session.ageRestriction || 'ALL AGES')}</span>
                </td>
              </tr>
              <tr style="border-bottom: 1px solid #f8fafc;">
                <td style="padding: 5px 0; font-weight: bold; color: #64748b;">🏷️ Categories:</td>
                <td style="padding: 5px 0; color: #0f172a; font-weight: 500;">${this.escapeHtml(categoriesList)}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f8fafc;">
                <td style="padding: 5px 0; font-weight: bold; color: #64748b;">🗣️ Languages:</td>
                <td style="padding: 5px 0; color: #0f172a; font-weight: 500;">${this.escapeHtml(languagesList)}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; font-weight: bold; color: #64748b;">🎫 Ticket Sales:</td>
                <td style="padding: 5px 0; color: #475569; font-style: italic;">${saleStartStr} &mdash; ${saleEndStr}</td>
              </tr>
            </table>

            <div style="font-size: 12px; font-weight: 800; color: #1e293b; margin-top: 15px; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">🎟️ Ticket Pricing Tiers</div>
            ${ticketsTableHtml}
          </div>
        `;
      }

      html += `</div>`;
      return html;
    } catch (err) {
      this.logger.error(`Error building event details HTML: ${err.message}`);
      return '<div style="color: #ef4444; font-weight: bold;">Failed to build detailed event configuration.</div>';
    }
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
      const organizer = await manager.getRepository(User).findOne({
        where: { id: event.organizerId },
      });

      if (!organizer) {
        throw new NotFoundException(
          `Organizer record not found for organizer ID: ${event.organizerId}`,
        );
      }

      // 2. Identify if there is a pending revision (Shadow Copy Pattern)
      const revisionIndex = event.statusLog.findIndex(
        (log: any) => log.action === 'REVISION_SUBMITTED' && log.status === 'PENDING',
      );

      if (revisionIndex !== -1) {
        // --- CASE A: REVIEWING A SHADOW COPY REVISION ---
        const revision = event.statusLog[revisionIndex] as any;
        const payload = revision.payload as UpdateEventDto;

        if (dto.action === ReviewAction.APPROVE) {
          // Update revision status
          revision.status = 'APPROVED';
          revision.adminId = dto.adminId;
          revision.timestamp = Date.now();

          // Merge event metadata fields only
          if (payload.title !== undefined) {
            event.title = payload.title.trim();
          }
          if (payload.description !== undefined) {
            event.description = payload.description.trim();
          }
          if (payload.slug !== undefined) {
            const nextSlug = payload.slug.trim();
            const existingSlug = await manager.findOne(Event, {
              where: { slug: nextSlug, deletedAt: IsNull() },
            });
            if (existingSlug && existingSlug.id !== event.id) {
              throw new ConflictException('Event slug already exists.');
            }
            event.slug = nextSlug;
          }
          
          // Append approval audit entry
          event.statusLog.push({
            action: 'APPROVED_REVISION',
            adminId: dto.adminId,
            timestamp: Date.now(),
            reason: null,
          } as any);

          const savedEvent = await manager.save(event);

          return {
            message: 'Shadow copy revision approved and merged into live event tables.',
            event: savedEvent,
            emailAction: {
              type: 'approved',
              organizerId: organizer.id,
              organizerEmail: organizer.email,
              title: savedEvent.title,
              publishAt: 'Live (Immediate Revision)',
            },
          };
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

          return {
            message: 'Shadow copy revision rejected.',
            event: savedEvent,
            emailAction: {
              type: 'rejected',
              organizerId: organizer.id,
              organizerEmail: organizer.email,
              title: savedEvent.title,
              reason: dto.reason,
            },
          };
        }
      }

      // --- CASE B: REVIEWING INITIAL EVENT CONFIGURATION ---
      if (event.status !== EventStatus.PENDING_APPROVAL) {
        throw new ConflictException(EventMessages.NOT_PENDING);
      }

      if (dto.action === ReviewAction.APPROVE) {
        // Run rigorous DB check before approving
        await EventValidator.validateEventApprovalDb(event.id, manager);

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

        return {
          message: `Event approved successfully and is now live. Status: ${savedEvent.status}`,
          event: savedEvent,
          emailAction: {
            type: 'approved',
            organizerId: organizer.id,
            organizerEmail: organizer.email,
            title: savedEvent.title,
          },
        };
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

        return {
          message: 'Event review rejected. Event unlocked for editing.',
          event: savedEvent,
          emailAction: {
            type: 'rejected',
            organizerId: organizer.id,
            organizerEmail: organizer.email,
            title: savedEvent.title,
            reason: dto.reason,
          },
        };
      }
    });

    await this.invalidateEventCache(eventId);
    await this.searchSyncQueue.add('upsert-event', { eventId });

    if (result?.emailAction) {
      const { type, organizerId, organizerEmail, title, publishAt, reason } =
        result.emailAction;

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isValidEmail =
        organizerEmail && emailRegex.test(organizerEmail.trim());

      if (!isValidEmail) {
        this.logger.warn(
          `Organizer notification skipped. No valid email configured for organizer ID: ${organizerId}. Configured email: "${organizerEmail || ''}"`,
        );
      } else {
        const email = organizerEmail.trim();
        try {
          if (type === 'approved') {
            const template = this.emailService.getEmailTemplate(
              'event.approved',
              {
                title,
                ...(publishAt ? { publishAt } : {}),
              },
            );
            await this.emailService.sendEmail(
              email,
              template.subject,
              template.text,
              template.html,
            );
          } else {
            const template = this.emailService.getEmailTemplate(
              'event.rejected',
              {
                title,
                reason,
              },
            );
            await this.emailService.sendEmail(
              email,
              template.subject,
              template.text,
              template.html,
            );
          }
          this.logger.log(
            `Successfully sent event review email (${type}) to organizer ID: ${organizerId}, email: ${email} for event ID: ${eventId}`,
          );
        } catch (mailErr) {
          const errorInstance = mailErr instanceof Error ? mailErr : new Error(String(mailErr));
          this.logger.error(
            `Failed to send review email (${type}) to organizer ID: ${organizerId}, email: ${email} for event ID: ${eventId}. Error: ${errorInstance.message}`,
            errorInstance.stack,
          );
        }
      }
    }

    return {
      message: result.message,
      event: result.event,
    };
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

      if (event.status !== EventStatus.PUBLISHED) {
        throw new ConflictException('Only published events can be cancelled.');
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

        const tickets = await manager.find(SessionTicketType, {
          where: { sessionId: session.id },
        });
        for (const ticket of tickets) {
          ticket.status = TicketTypeStatus.INACTIVE;
          await manager.save(ticket);
        }
      }

      // Fetch the organizer
      const organizer = await manager.getRepository(User).findOne({
        where: { id: event.organizerId },
      });

      if (!organizer) {
        throw new NotFoundException(
          `Organizer record not found for organizer ID: ${event.organizerId}`,
        );
      }

      return {
        message: 'Event and all associated sessions cancelled immediately.',
        event: savedEvent,
        emailAction: {
          organizerId: organizer.id,
          organizerEmail: organizer.email,
          title: savedEvent.title,
          reason: `EMERGENCY TERMINATION: ${reason}`,
        },
      };
    });

    await this.invalidateEventCache(eventId);
    await this.searchSyncQueue.add('delete-event', { eventId });

    if (result?.emailAction) {
      const {
        organizerId,
        organizerEmail,
        title,
        reason: emailReason,
      } = result.emailAction;

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isValidEmail =
        organizerEmail && emailRegex.test(organizerEmail.trim());

      if (!isValidEmail) {
        this.logger.warn(
          `Organizer notification skipped. No valid email configured for organizer ID: ${organizerId}. Configured email: "${organizerEmail || ''}"`,
        );
      } else {
        const email = organizerEmail.trim();
        try {
          const template = this.emailService.getEmailTemplate(
            'event.rejected',
            {
              title,
              reason: emailReason,
            },
          );
          await this.emailService.sendEmail(
            email,
            `[CANCELLED] ${template.subject}`,
            template.text,
            template.html,
          );
          this.logger.log(
            `Successfully sent event cancellation email to organizer ID: ${organizerId}, email: ${email} for event ID: ${eventId}`,
          );
        } catch (mailErr) {
          const errorInstance = mailErr instanceof Error ? mailErr : new Error(String(mailErr));
          this.logger.error(
            `Failed to send cancellation notification to organizer ID: ${organizerId}, email: ${email} for event ID: ${eventId}. Error: ${errorInstance.message}`,
            errorInstance.stack,
          );
        }
      }
    }

    return {
      message: result.message,
      event: result.event,
    };
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private escapeHtml(str: string): string {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
