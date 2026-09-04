import { Injectable } from '@nestjs/common';
import { EntityManager, LessThan } from 'typeorm';
import {
  Payment,
  PaymentStatus,
} from '../../../database/entities/payment.entity';
import {
  SessionTicketType,
  TicketTypeStatus,
} from '../../../database/entities/session-ticket-type.entity';
import type { PaymentLineItem } from '../../../database/entities/payment.entity';

@Injectable()
export class InventoryService {
  async decrementInventory(
    manager: EntityManager,
    ticket: SessionTicketType,
    quantity: number,
  ): Promise<void> {
    ticket.quantity -= quantity;
    if (ticket.quantity <= 0) {
      ticket.quantity = 0;
      ticket.status = TicketTypeStatus.SOLD_OUT;
    }
    await manager.save(SessionTicketType, ticket);
  }

  async incrementInventory(
    manager: EntityManager,
    ticketTypeId: string,
    quantity: number,
  ): Promise<void> {
    const ticket = await manager.findOne(SessionTicketType, {
      where: { id: ticketTypeId },
      lock: { mode: 'pessimistic_write' },
    });
    if (!ticket) {
      return;
    }
    ticket.quantity += quantity;
    if (ticket.quantity > 0 && ticket.status === TicketTypeStatus.SOLD_OUT) {
      ticket.status = TicketTypeStatus.ACTIVE;
    }
    await manager.save(SessionTicketType, ticket);
  }

  async releaseItems(
    manager: EntityManager,
    items: PaymentLineItem[],
  ): Promise<void> {
    for (const item of items) {
      await this.incrementInventory(manager, item.ticketTypeId, item.quantity);
    }
  }

  async releaseHoldForPayment(
    manager: EntityManager,
    payment: Payment,
  ): Promise<void> {
    if (payment.inventoryReleasedAt) {
      return;
    }
    await this.releaseItems(manager, payment.metadata?.items ?? []);
    payment.inventoryReleasedAt = Date.now();
    await manager.save(Payment, payment);
  }

  async releaseExpiredHolds(manager: EntityManager): Promise<void> {
    const expired = await manager.find(Payment, {
      where: {
        status: PaymentStatus.CREATED,
        expiresAt: LessThan(Date.now()),
      },
    });

    for (const payment of expired) {
      const locked = await manager.findOne(Payment, {
        where: { id: payment.id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!locked || locked.status !== PaymentStatus.CREATED) {
        continue;
      }
      locked.status = PaymentStatus.CANCELLED;
      await this.releaseHoldForPayment(manager, locked);
    }
  }
}
