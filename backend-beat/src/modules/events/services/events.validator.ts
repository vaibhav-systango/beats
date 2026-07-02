import { BadRequestException } from '@nestjs/common';
import { EntityManager, IsNull } from 'typeorm';
import { EventSession } from '../../../database/entities/event-session.entity';
import { SessionTicketType, TicketTypeStatus } from '../../../database/entities/session-ticket-type.entity';
import { SessionCategory } from '../../../database/entities/session-category.entity';
import { CreateEventSessionDto } from '../dto/create-session.dto';

export class EventValidator {
  /**
   * Validates a single session's temporal, capacity, and marketing properties.
   */
  static validateSessionPayload(session: CreateEventSessionDto, isUpdate = false) {
    // 1. Temporal Guardrails: ticketSaleStartAt < ticketSaleEndAt <= startAt < endAt
    if (Number(session.ticketSaleStartAt) >= Number(session.ticketSaleEndAt)) {
      throw new BadRequestException(
        `ticketSaleStartAt must be strictly before ticketSaleEndAt.`,
      );
    }
    if (Number(session.ticketSaleEndAt) > Number(session.startAt)) {
      throw new BadRequestException(
        `ticketSaleEndAt must be before or equal to startAt.`,
      );
    }
    if (Number(session.startAt) >= Number(session.endAt)) {
      throw new BadRequestException(
        `startAt must be strictly before endAt.`,
      );
    }

    // 2. Capacity Guardrails: Sum of ticket type capacities <= session capacity
    if (!isUpdate) {
      if (!session.ticketTypes || session.ticketTypes.length === 0) {
        throw new BadRequestException(
          `At least one pricing tier (ticket type) is required for the session.`,
        );
      }
    }

    if (session.ticketTypes && session.ticketTypes.length > 0) {
      const totalTicketsQuantity = session.ticketTypes.reduce(
        (sum, t) => sum + t.quantity,
        0,
      );
      if (totalTicketsQuantity > session.capacity) {
        throw new BadRequestException(
          `Sum of all ticket type quantities (${totalTicketsQuantity}) exceeds the parent session's capacity constraint (${session.capacity}).`,
        );
      }
    }

    // 3. Marketing Guardrails
    if (session.allowReferral) {
      if (
        session.referralRewardPerTicket === undefined ||
        session.referralRewardPerTicket === null ||
        Number(session.referralRewardPerTicket) <= 0 ||
        Number(session.referralRewardPerTicket) > 100
      ) {
        throw new BadRequestException(
          `referralRewardPerTicket must be a positive percentage <= 100.00 when allowReferral is enabled.`,
        );
      }
    }
  }

  /**
   * Enforces strict business validations on all database stored sessions for an event inside a transactional scope.
   */
  static async validateEventApprovalDb(eventId: string, manager: EntityManager) {
    const sessions = await manager.find(EventSession, {
      where: { eventId, deletedAt: IsNull() },
    });

    if (!sessions || sessions.length === 0) {
      throw new BadRequestException('At least one event session is required for approval.');
    }

    const now = Date.now();
    const allSessionsPassed = sessions.every((s) => Number(s.endAt) < now);
    if (allSessionsPassed) {
      throw new BadRequestException(
        'Cannot approve an event where all associated sessions have already ended.',
      );
    }

    for (let i = 0; i < sessions.length; i++) {
      const session = sessions[i];
      const sessionLabel = `Session #${i + 1} (${session.title || 'Untitled'})`;

      // 1. Temporal Guardrails
      if (Number(session.ticketSaleStartAt) >= Number(session.ticketSaleEndAt)) {
        throw new BadRequestException(
          `${sessionLabel}: ticketSaleStartAt must be strictly before ticketSaleEndAt.`,
        );
      }
      if (Number(session.ticketSaleEndAt) > Number(session.startAt)) {
        throw new BadRequestException(
          `${sessionLabel}: ticketSaleEndAt must be before or equal to startAt.`,
        );
      }
      if (Number(session.startAt) >= Number(session.endAt)) {
        throw new BadRequestException(
          `${sessionLabel}: startAt must be strictly before endAt.`,
        );
      }

      // 2. Capacity Guardrails
      const ticketTypes = await manager.find(SessionTicketType, {
        where: { sessionId: session.id, status: TicketTypeStatus.ACTIVE },
      });
      if (ticketTypes.length === 0) {
        throw new BadRequestException(
          `${sessionLabel}: At least one pricing tier (ticket type) is required for approval.`,
        );
      }
      const totalTicketsQuantity = ticketTypes.reduce(
        (sum, t) => sum + t.quantity,
        0,
      );
      if (totalTicketsQuantity > session.capacity) {
        throw new BadRequestException(
          `${sessionLabel}: Sum of all ticket type quantities (${totalTicketsQuantity}) exceeds the parent session's capacity constraint (${session.capacity}).`,
        );
      }

      // 3. Marketing Guardrails
      if (session.allowReferral) {
        if (
          session.referralRewardPerTicket === undefined ||
          session.referralRewardPerTicket === null ||
          Number(session.referralRewardPerTicket) <= 0 ||
          Number(session.referralRewardPerTicket) > 100
        ) {
          throw new BadRequestException(
            `${sessionLabel}: referralRewardPerTicket must be a positive percentage <= 100.00 when allowReferral is enabled.`,
          );
        }
      }

      // 4. Session Medias verification
      const coverUrl = session.eventSessionMedias?.cover?.url;
      if (!coverUrl || coverUrl.trim() === '') {
        throw new BadRequestException(
          `${sessionLabel}: Cover image (banner asset) is mandatory for submission.`,
        );
      }

      const gallery = session.eventSessionMedias?.gallery || [];
      if (gallery.length < 3) {
        throw new BadRequestException(
          `${sessionLabel}: At least 3 gallery images are required for submission.`,
        );
      }

      const videos = session.eventSessionMedias?.videos || [];
      if (videos.length < 1) {
        throw new BadRequestException(
          `${sessionLabel}: At least 1 video is required for submission.`,
        );
      }

      // 5. Category verification
      const categoryCount = await manager.count(SessionCategory, {
        where: { sessionId: session.id },
      });
      if (categoryCount === 0) {
        throw new BadRequestException(
          `${sessionLabel}: At least one category must be assigned for submission.`,
        );
      }
    }
  }
}
