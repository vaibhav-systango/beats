import { Injectable, NotFoundException } from '@nestjs/common';
import { IsNull } from 'typeorm';
import { EventSessionRepository } from '../../../database/repositories/event-session.repository';
import { SessionTicketTypeRepository } from '../../../database/repositories/session-ticket-type.repository';
import { SessionTicketType } from '../../../database/entities/session-ticket-type.entity';
import { SessionStatus } from '../../../database/entities/event-session.entity';
import { TicketsMessages } from '../constants/tickets.constants';
import {
  SessionTicketItemDto,
  SessionTicketsResponseDto,
} from '../dto/session-tickets-response.dto';

@Injectable()
export class TicketsService {
  constructor(
    private readonly eventSessionRepository: EventSessionRepository,
    private readonly sessionTicketTypeRepository: SessionTicketTypeRepository,
  ) {}

  async getSessionTickets(sessionId: string): Promise<SessionTicketsResponseDto> {
    const session = await this.eventSessionRepository.findOne({
      where: { id: sessionId, deletedAt: IsNull() },
      relations: { event: true },
    });

    if (!session || !session.event) {
      throw new NotFoundException(TicketsMessages.SESSION_NOT_FOUND);
    }

    if (
      session.status === SessionStatus.CANCELLED ||
      session.status === SessionStatus.COMPLETED
    ) {
      throw new NotFoundException(TicketsMessages.SESSION_NOT_AVAILABLE);
    }

    const tickets =
      await this.sessionTicketTypeRepository.findActiveTicketsBySessionIdOrderedByPrice(
        sessionId,
      );

    const now = Date.now();
    const ticketSaleStartAt = Number(session.ticketSaleStartAt);
    const ticketSaleEndAt = Number(session.ticketSaleEndAt);

    return {
      sessionId: session.id,
      sessionTitle: session.title ?? null,
      eventId: session.eventId,
      eventTitle: session.event.title,
      ticketSaleStartAt,
      ticketSaleEndAt,
      tickets: tickets.map((ticket) =>
        this.mapTicket(ticket, now, ticketSaleStartAt, ticketSaleEndAt),
      ),
    };
  }

  private mapTicket(
    ticket: SessionTicketType,
    now: number,
    sessionSaleStartAt: number,
    sessionSaleEndAt: number,
  ): SessionTicketItemDto {
    const remainingQuantity = ticket.quantity;
    const isSoldOut = remainingQuantity <= 0;
    const saleStartAt = Number(ticket.saleStartAt);
    const saleEndAt = Number(ticket.saleEndAt);
    const withinTicketWindow = now >= saleStartAt && now <= saleEndAt;
    const withinSessionWindow =
      now >= sessionSaleStartAt && now <= sessionSaleEndAt;
    const canPurchase =
      remainingQuantity > 0 && withinTicketWindow && withinSessionWindow;

    return {
      id: ticket.id,
      name: ticket.name,
      description: ticket.description ?? null,
      price: Number(ticket.price),
      quantity: ticket.quantity,
      remainingQuantity,
      maxPurchaseLimit: ticket.maxPurchaseLimit,
      saleStartAt,
      saleEndAt,
      isSoldOut,
      canPurchase,
    };
  }
}
