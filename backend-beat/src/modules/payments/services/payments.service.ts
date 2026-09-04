import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource, EntityManager, In } from 'typeorm';
import { ulid } from 'ulid';
import { UserRole } from '../../../common/enums/user.enums';
import { EventMessages } from '../../events/constants/events.constants';
import { EventStatus } from '../../../database/entities/event.entity';
import { SessionStatus } from '../../../database/entities/event-session.entity';
import {
  Payment,
  PaymentMetadata,
  PaymentStatus,
} from '../../../database/entities/payment.entity';
import { PaymentWebhookEvent } from '../../../database/entities/payment-webhook-event.entity';
import { PaymentSplit, PayoutStatus } from '../../../database/entities/payment-split.entity';
import {
  IssuedTicket,
} from '../../../database/entities/issued-ticket.entity';
import {
  SessionTicketType,
  TicketTypeStatus,
} from '../../../database/entities/session-ticket-type.entity';
import { User } from '../../../database/entities/user.entity';
import { WalletLedgerEntry } from '../../../database/entities/wallet-ledger-entry.entity';
import { PaymentRepository } from '../../../database/repositories/payment.repository';
import { UserRepository } from '../../../database/repositories/user.repository';
import { PaymentConstants, PaymentMessages } from '../constants/payments.constants';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import { PaymentResponseDto } from '../dto/payment-response.dto';
import { VerifyPaymentDto } from '../dto/verify-payment.dto';
import { PAYMENT_PROVIDER } from '../providers/payment-provider.interface';
import type {
  IPaymentProvider,
  NormalizedPaymentEvent,
  PaymentClientPayload,
} from '../providers/payment-provider.interface';
import { isUniqueViolation } from '../helpers/db-errors.helper';
import { paiseToRupees, rupeesToPaise } from '../helpers/money.helper';
import { canTransition, eventTypeToStatus } from '../helpers/payment-status.helper';
import { PaymentFulfillmentService } from './payment-fulfillment.service';
import { PayoutService } from './payout.service';
import { InventoryService } from './inventory.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly reservationTtlMs: number;

  constructor(
    @Inject(PAYMENT_PROVIDER)
    private readonly paymentProvider: IPaymentProvider,
    private readonly paymentRepository: PaymentRepository,
    private readonly userRepository: UserRepository,
    private readonly dataSource: DataSource,
    private readonly inventoryService: InventoryService,
    private readonly fulfillmentService: PaymentFulfillmentService,
    private readonly payoutService: PayoutService,
    configService: ConfigService,
  ) {
    this.reservationTtlMs = Number(
      configService.get<number>('payment.reservationTtlMs') ?? 900_000,
    );
  }

  async createPayment(
    userId: string,
    dto: CreatePaymentDto,
  ): Promise<PaymentResponseDto> {
    const idempotencyKey = dto.idempotencyKey ?? ulid();

    let saved: Payment;
    try {
      saved = await this.dataSource.transaction(async (manager) => {
        await this.inventoryService.releaseExpiredHolds(manager);
        const existing = await manager.findOne(Payment, {
          where: { userId, idempotencyKey },
        });
        if (
          existing?.providerOrderId ||
          existing?.status === PaymentStatus.SUCCEEDED ||
          existing?.status === PaymentStatus.PENDING
        ) {
          return existing;
        }
        if (existing?.status === PaymentStatus.CREATED) {
          return existing;
        }
        if (existing) {
          return existing;
        }
        return this.createHeldPayment(manager, userId, dto, idempotencyKey);
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        const duplicate = await this.paymentRepository.findByIdempotency(
          userId,
          idempotencyKey,
        );
        if (duplicate) {
          return this.toResponse(duplicate);
        }
      }
      throw error;
    }

    if (saved.status === PaymentStatus.SUCCEEDED) {
      return this.toResponse(saved, saved.amount === 0 ? null : undefined);
    }
    if (saved.providerOrderId || saved.status === PaymentStatus.PENDING) {
      return this.toResponse(saved);
    }
    if (saved.amount === 0) {
      return this.toResponse(saved, null);
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    const created = await this.paymentProvider.createPayment({
      paymentId: saved.id,
      amount: saved.amount,
      currency: PaymentConstants.CURRENCY,
      customer: {
        userId,
        email: user?.email,
        phone: user ? `${user.countryCode}${user.phoneNumber}` : undefined,
      },
      description: `Beats tickets (${saved.metadata?.items?.length ?? 0} type(s))`,
      metadata: { paymentId: saved.id, userId },
      idempotencyKey,
    });

    saved.providerOrderId = created.providerOrderId;
    saved.providerPaymentId = created.providerPaymentId ?? null;
    saved.status = PaymentStatus.PENDING;
    await this.paymentRepository.save(saved);

    return this.toResponse(saved, created.clientPayload);
  }

  async verifyPayment(
    userId: string,
    paymentId: string,
    dto: VerifyPaymentDto,
  ): Promise<PaymentResponseDto> {
    const payment = await this.requireOwnedPayment(userId, paymentId);

    if (payment.status === PaymentStatus.SUCCEEDED) {
      if (!payment.fulfilledAt) {
        await this.dataSource.transaction(async (manager) => {
          const locked = await this.lockPayment(manager, payment.id);
          await this.fulfillmentService.fulfillIfNeeded(manager, locked);
        });
        const reloaded = await this.requireOwnedPayment(userId, paymentId);
        return this.toResponse(reloaded);
      }
      return this.toResponse(payment);
    }

    this.assertActiveProvider(payment);

    if (!payment.providerOrderId) {
      throw new BadRequestException(PaymentMessages.VERIFY_FAILED);
    }

    const event = await this.paymentProvider.verifyPayment({
      providerOrderId: payment.providerOrderId,
      payload: {
        providerPaymentId: dto.providerPaymentId,
        providerOrderId: dto.providerOrderId,
        signature: dto.signature,
      },
    });

    const updated = await this.applyEvent(event, payment);
    return this.toResponse(updated ?? payment);
  }

  async getPayment(
    userId: string,
    paymentId: string,
  ): Promise<PaymentResponseDto> {
    const payment = await this.requireOwnedPayment(userId, paymentId);
    return this.toResponse(payment);
  }

  async refundPayment(
    actorUserId: string,
    actorRole: string,
    paymentId: string,
  ): Promise<PaymentResponseDto> {
    const payment = await this.requireRefundablePayment(
      actorUserId,
      actorRole,
      paymentId,
    );

    if (payment.status === PaymentStatus.REFUNDED) {
      return this.toResponse(payment);
    }

    const updated = await this.dataSource.transaction(async (manager) => {
      const locked = await this.lockPayment(manager, payment.id);
      if (locked.status === PaymentStatus.REFUNDED) {
        return locked;
      }
      if (locked.status !== PaymentStatus.SUCCEEDED) {
        throw new BadRequestException(PaymentMessages.REFUND_NOT_ALLOWED);
      }

      // Hold payout rows for this payment so settlement cannot interleave.
      await manager.find(PaymentSplit, {
        where: { paymentId: locked.id },
        lock: { mode: 'pessimistic_write' },
      });

      if (await this.payoutService.hasPaidPayout(manager, locked.id)) {
        throw new ConflictException(PaymentMessages.REFUND_PAYOUT_PAID);
      }

      let refundId: string | null = locked.providerRefundId ?? null;
      if (locked.amount > 0 && !refundId) {
        this.assertActiveProvider(locked);
        if (!locked.providerPaymentId) {
          throw new BadRequestException(PaymentMessages.REFUND_FAILED);
        }
        const refunded = await this.paymentProvider.refundPayment({
          providerPaymentId: locked.providerPaymentId,
        });
        refundId = refunded.refundId;
        locked.providerRefundId = refundId;
        await manager.save(Payment, locked);
      }

      await this.fulfillmentService.reverseFulfillment(manager, locked);
      locked.status = PaymentStatus.REFUNDED;
      locked.refundedAmount = locked.amount;
      locked.providerRefundId = refundId;
      return manager.save(Payment, locked);
    });

    return this.toResponse(updated);
  }

  async handleWebhook(
    providerSlug: string,
    rawBody: Buffer,
    headers: Record<string, string>,
  ): Promise<{ received: true }> {
    const expected = this.paymentProvider.name.toLowerCase();
    if (providerSlug.toLowerCase() !== expected) {
      throw new BadRequestException(PaymentMessages.WEBHOOK_PROVIDER_INACTIVE);
    }

    const event = await this.paymentProvider.parseWebhook(rawBody, headers);
    if (!event) {
      return { received: true };
    }

    try {
      await this.applyEvent(event);
    } catch (error) {
      if (error instanceof BadRequestException) {
        this.logger.warn(
          `Ignoring deterministic webhook rejection ${event.providerEventId}: ${error.message}`,
        );
        return { received: true };
      }
      this.logger.error(
        `Failed to apply webhook ${event.providerEventId}`,
        error,
      );
      throw error;
    }

    return { received: true };
  }

  async applyEvent(
    event: NormalizedPaymentEvent,
    knownPayment?: Payment,
  ): Promise<Payment | null> {
    return this.dataSource.transaction(async (manager) => {
      await this.recordWebhookEvent(manager, event);

      const payment =
        (knownPayment
          ? await this.lockPayment(manager, knownPayment.id)
          : await this.findPaymentForEvent(manager, event)) ?? null;
      if (!payment) {
        this.logger.warn(
          `Ignoring webhook ${event.providerEventId}; payment not found`,
        );
        return null;
      }

      if (
        event.providerOrderId &&
        payment.providerOrderId &&
        event.providerOrderId !== payment.providerOrderId
      ) {
        this.logger.warn(
          `Ignoring webhook ${event.providerEventId}; order mismatch event=${event.providerOrderId} payment=${payment.providerOrderId}`,
        );
        throw new BadRequestException(PaymentMessages.VERIFY_ORDER_MISMATCH);
      }

      if (event.amount != null && event.amount !== payment.amount) {
        this.logger.warn(
          `Amount mismatch for payment ${payment.id}: stored=${payment.amount} event=${event.amount}`,
        );
        throw new BadRequestException(PaymentMessages.AMOUNT_MISMATCH);
      }

      if (
        event.currency &&
        event.currency.toUpperCase() !== PaymentConstants.CURRENCY
      ) {
        this.logger.warn(
          `Currency mismatch for payment ${payment.id}: stored=${PaymentConstants.CURRENCY} event=${event.currency}`,
        );
        throw new BadRequestException(PaymentMessages.CURRENCY_MISMATCH);
      }

      const nextStatus = eventTypeToStatus(event.type);
      if (!canTransition(payment.status, nextStatus)) {
        this.logger.warn(
          `Ignoring invalid transition ${payment.status} -> ${nextStatus} for ${payment.id}`,
        );
        if (payment.status === PaymentStatus.SUCCEEDED) {
          await this.fulfillmentService.fulfillIfNeeded(manager, payment);
        }
        return payment;
      }

      if (payment.status !== nextStatus) {
        payment.status = nextStatus;
        if (event.providerPaymentId) {
          payment.providerPaymentId = event.providerPaymentId;
        }
        if (event.providerOrderId && !payment.providerOrderId) {
          payment.providerOrderId = event.providerOrderId;
        }
        if (nextStatus === PaymentStatus.FAILED) {
          payment.failureCode = event.failureCode ?? null;
          payment.failureMessage = event.failureMessage ?? null;
        }
        if (nextStatus === PaymentStatus.SUCCEEDED) {
          payment.failureCode = null;
          payment.failureMessage = null;
        }
      } else if (event.providerPaymentId && !payment.providerPaymentId) {
        payment.providerPaymentId = event.providerPaymentId;
      }

      const saved = await manager.save(Payment, payment);

      if (saved.status === PaymentStatus.SUCCEEDED) {
        await this.fulfillmentService.fulfillIfNeeded(manager, saved);
      }
      if (
        saved.status === PaymentStatus.FAILED ||
        saved.status === PaymentStatus.CANCELLED
      ) {
        await this.inventoryService.releaseHoldForPayment(manager, saved);
      }

      return saved;
    });
  }

  async getAdminPayment(paymentId: string) {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
    });
    if (!payment) {
      throw new NotFoundException(PaymentMessages.NOT_FOUND);
    }

    const tickets = await this.dataSource.getRepository(IssuedTicket).find({
      where: { paymentId: payment.id },
    });
    const splits = await this.dataSource.getRepository(PaymentSplit).find({
      where: { paymentId: payment.id },
    });
    const ledger = await this.dataSource.getRepository(WalletLedgerEntry).find({
      where: { paymentId: payment.id },
      order: { createdAt: 'ASC' },
    });

    return {
      payment: this.toAdminPayment(payment),
      tickets: tickets.map((ticket) => ({
        id: ticket.id,
        ticketTypeId: ticket.ticketTypeId,
        sessionId: ticket.sessionId,
        status: ticket.status,
      })),
      splits: splits.map((split) => ({
        id: split.id,
        recipientType: split.recipientType,
        ownerUserId: split.ownerUserId ?? null,
        walletId: split.walletId,
        amount: paiseToRupees(split.amountPaise),
        payoutStatus: split.payoutStatus,
        settlementBatchId: split.settlementBatchId ?? null,
        settledAt: split.settledAt ? Number(split.settledAt) : null,
      })),
      ledger: ledger.map((entry) => ({
        id: entry.id,
        walletId: entry.walletId,
        amount: paiseToRupees(entry.amountPaise),
        direction: entry.direction,
        reason: entry.reason,
        splitId: entry.splitId ?? null,
        reversesEntryId: entry.reversesEntryId ?? null,
        createdAt: Number(entry.createdAt),
      })),
    };
  }

  async listAdminPayouts(query: {
    status?: string;
    limit: number;
    offset: number;
  }) {
    const repo = this.dataSource.getRepository(PaymentSplit);
    const where = query.status
      ? { payoutStatus: query.status as PayoutStatus }
      : {};
    const [items, total] = await repo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      take: query.limit,
      skip: query.offset,
    });
    return {
      items: items.map((split) => ({
        id: split.id,
        paymentId: split.paymentId,
        walletId: split.walletId,
        amount: paiseToRupees(split.amountPaise),
        status: split.payoutStatus,
        settlementBatchId: split.settlementBatchId ?? null,
        settledAt: split.settledAt ? Number(split.settledAt) : null,
        createdAt: Number(split.createdAt),
      })),
      total,
      limit: query.limit,
      offset: query.offset,
    };
  }

  async runSettlement() {
    const result = await this.dataSource.transaction(async (manager) =>
      this.payoutService.settleScheduled(manager),
    );
    return {
      settlementBatchId: result.settlementBatchId,
      paidCount: result.paidCount,
      paidAmount: paiseToRupees(result.paidAmountPaise),
    };
  }

  private async createHeldPayment(
    manager: EntityManager,
    userId: string,
    dto: CreatePaymentDto,
    idempotencyKey: string,
  ): Promise<Payment> {
    const priced = await this.priceItems(manager, dto);
    await this.assertSplitParticipants(manager, userId, dto, priced.tickets);

    const referrerUserId = priced.needsReferrer
      ? dto.referrerUserId
      : undefined;
    const promoterUserId = priced.needsPromoter
      ? dto.promoterUserId
      : undefined;

    for (const ticket of priced.tickets) {
      const quantity =
        priced.items.find((item) => item.ticketTypeId === ticket.id)
          ?.quantity ?? 0;
      await this.inventoryService.decrementInventory(manager, ticket, quantity);
    }

    const payment = manager.create(Payment, {
      userId,
      provider: this.paymentProvider.name,
      amount: priced.amountPaise,
      currency: PaymentConstants.CURRENCY,
      status:
        priced.amountPaise === 0
          ? PaymentStatus.SUCCEEDED
          : PaymentStatus.CREATED,
      idempotencyKey,
      metadata: { items: priced.items },
      refundedAmount: 0,
      expiresAt: Date.now() + this.reservationTtlMs,
      referrerUserId: referrerUserId ?? null,
      promoterUserId: promoterUserId ?? null,
    });
    const saved = await manager.save(Payment, payment);

    if (saved.status === PaymentStatus.SUCCEEDED) {
      await this.fulfillmentService.fulfillIfNeeded(manager, saved);
    }

    return saved;
  }

  private async priceItems(
    manager: EntityManager,
    dto: CreatePaymentDto,
  ): Promise<{
    amountPaise: number;
    items: PaymentMetadata['items'];
    tickets: SessionTicketType[];
    needsReferrer: boolean;
    needsPromoter: boolean;
  }> {
    const ticketTypeIds = dto.items.map((item) => item.ticketTypeId);
    if (new Set(ticketTypeIds).size !== ticketTypeIds.length) {
      throw new BadRequestException(PaymentMessages.DUPLICATE_TICKET_TYPE);
    }

    const tickets = await manager.find(SessionTicketType, {
      where: { id: In(ticketTypeIds) },
      lock: { mode: 'pessimistic_write' },
    });
    if (tickets.length !== ticketTypeIds.length) {
      throw new NotFoundException(EventMessages.TICKET_NOT_FOUND);
    }

    const ticketsWithRelations = await manager.find(SessionTicketType, {
      where: { id: In(ticketTypeIds) },
      relations: { session: { event: true } },
    });
    const relationsById = new Map(
      ticketsWithRelations.map((ticket) => [ticket.id, ticket]),
    );
    for (const ticket of tickets) {
      const related = relationsById.get(ticket.id);
      ticket.session = related?.session as SessionTicketType['session'];
    }

    const quantityById = new Map(
      dto.items.map((item) => [item.ticketTypeId, item.quantity]),
    );
    const now = Date.now();
    const pricedItems: PaymentMetadata['items'] = [];
    let amountPaise = 0;
    let needsReferrer = false;
    let needsPromoter = false;

    for (const ticket of tickets) {
      this.assertTicketPurchasable(ticket, now);
      const quantity = quantityById.get(ticket.id) ?? 0;
      if (quantity > ticket.maxPurchaseLimit) {
        throw new BadRequestException(EventMessages.CHECKOUT_INVALID_INPUT);
      }
      if (quantity > ticket.quantity) {
        throw new ConflictException(EventMessages.INSUFFICIENT_INVENTORY);
      }
      const unitPricePaise = rupeesToPaise(ticket.price);
      amountPaise += unitPricePaise * quantity;
      pricedItems.push({
        ticketTypeId: ticket.id,
        sessionId: ticket.sessionId,
        quantity,
        unitPricePaise,
      });
      if (ticket.session?.allowReferral) {
        needsReferrer = true;
      }
      if (ticket.session?.allowPromoters) {
        needsPromoter = true;
      }
    }

    return {
      amountPaise,
      items: pricedItems,
      tickets,
      needsReferrer,
      needsPromoter,
    };
  }

  private async assertSplitParticipants(
    manager: EntityManager,
    buyerUserId: string,
    dto: CreatePaymentDto,
    tickets: SessionTicketType[],
  ): Promise<void> {
    const needsReferrer = tickets.some(
      (ticket) => ticket.session?.allowReferral,
    );
    const needsPromoter = tickets.some(
      (ticket) => ticket.session?.allowPromoters,
    );

    if (needsReferrer) {
      if (!dto.referrerUserId) {
        throw new BadRequestException(PaymentMessages.REFERRER_REQUIRED);
      }
      if (dto.referrerUserId === buyerUserId) {
        throw new BadRequestException(PaymentMessages.REFERRER_INVALID);
      }
      const referrer = await manager.findOne(User, {
        where: { id: dto.referrerUserId },
      });
      if (!referrer || referrer.deletedAt) {
        throw new BadRequestException(PaymentMessages.REFERRER_INVALID);
      }
    }

    if (needsPromoter) {
      if (!dto.promoterUserId) {
        throw new BadRequestException(PaymentMessages.PROMOTER_REQUIRED);
      }
      if (dto.promoterUserId === buyerUserId) {
        throw new BadRequestException(PaymentMessages.PROMOTER_INVALID);
      }
      const promoter = await manager.findOne(User, {
        where: { id: dto.promoterUserId },
        relations: { role: true },
      });
      if (!promoter || promoter.deletedAt) {
        throw new BadRequestException(PaymentMessages.PROMOTER_INVALID);
      }
    }
  }

  private assertTicketPurchasable(
    ticket: SessionTicketType,
    now: number,
  ): void {
    if (ticket.status !== TicketTypeStatus.ACTIVE) {
      throw new BadRequestException(EventMessages.TICKET_NOT_FOUND);
    }

    const session = ticket.session;
    if (!session || session.deletedAt) {
      throw new NotFoundException(EventMessages.SESSION_NOT_FOUND);
    }
    if (session.status === SessionStatus.CANCELLED) {
      throw new BadRequestException(EventMessages.SESSION_CANCELLED);
    }
    if (session.status === SessionStatus.COMPLETED) {
      throw new BadRequestException(EventMessages.SESSION_COMPLETED);
    }

    const event = session.event;
    if (!event || event.deletedAt) {
      throw new NotFoundException(EventMessages.SESSION_NOT_FOUND);
    }
    if (event.status === EventStatus.CANCELLED) {
      throw new BadRequestException(EventMessages.EVENT_CANCELLED);
    }
    if (event.status !== EventStatus.PUBLISHED) {
      throw new BadRequestException(EventMessages.EVENT_NOT_PUBLISHED);
    }

    const sessionSaleStart = Number(session.ticketSaleStartAt);
    const sessionSaleEnd = Number(session.ticketSaleEndAt);
    if (now < sessionSaleStart || now > sessionSaleEnd) {
      throw new BadRequestException(EventMessages.SESSION_SALES_CLOSED);
    }

    const ticketSaleStart = Number(ticket.saleStartAt);
    const ticketSaleEnd = Number(ticket.saleEndAt);
    if (now < ticketSaleStart || now > ticketSaleEnd) {
      throw new BadRequestException(EventMessages.TICKET_SALES_CLOSED);
    }
  }

  private async findPaymentForEvent(
    manager: EntityManager,
    event: NormalizedPaymentEvent,
  ): Promise<Payment | null> {
    if (event.paymentId) {
      const byId = await manager.findOne(Payment, {
        where: { id: event.paymentId },
        lock: { mode: 'pessimistic_write' },
      });
      if (byId) {
        return byId;
      }
    }
    if (event.providerOrderId) {
      return manager.findOne(Payment, {
        where: {
          provider: event.provider,
          providerOrderId: event.providerOrderId,
        },
        lock: { mode: 'pessimistic_write' },
      });
    }
    return null;
  }

  private async lockPayment(
    manager: EntityManager,
    paymentId: string,
  ): Promise<Payment> {
    const payment = await manager.findOne(Payment, {
      where: { id: paymentId },
      lock: { mode: 'pessimistic_write' },
    });
    if (!payment) {
      throw new NotFoundException(PaymentMessages.NOT_FOUND);
    }
    return payment;
  }

  private async recordWebhookEvent(
    manager: EntityManager,
    event: NormalizedPaymentEvent,
  ): Promise<void> {
    try {
      await manager.save(
        PaymentWebhookEvent,
        manager.create(PaymentWebhookEvent, {
          provider: event.provider,
          providerEventId: event.providerEventId,
          paymentId: event.paymentId ?? null,
          eventType: event.type,
        }),
      );
    } catch (error) {
      if (!isUniqueViolation(error)) {
        throw error;
      }
    }
  }

  private async requireOwnedPayment(
    userId: string,
    paymentId: string,
  ): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
    });
    if (!payment) {
      throw new NotFoundException(PaymentMessages.NOT_FOUND);
    }
    if (payment.userId !== userId) {
      throw new ForbiddenException(PaymentMessages.FORBIDDEN);
    }
    return payment;
  }

  private async requireRefundablePayment(
    actorUserId: string,
    actorRole: string,
    paymentId: string,
  ): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
    });
    if (!payment) {
      throw new NotFoundException(PaymentMessages.NOT_FOUND);
    }
    if (
      payment.userId !== actorUserId &&
      (actorRole as UserRole) !== UserRole.ADMIN
    ) {
      throw new ForbiddenException(PaymentMessages.FORBIDDEN);
    }
    return payment;
  }

  private assertActiveProvider(payment: Payment): void {
    if (payment.provider !== this.paymentProvider.name) {
      throw new BadRequestException(PaymentMessages.PROVIDER_MISMATCH);
    }
  }

  private toAdminPayment(payment: Payment) {
    return {
      id: payment.id,
      userId: payment.userId,
      status: payment.status,
      amount: paiseToRupees(payment.amount),
      currency: PaymentConstants.CURRENCY,
      provider: payment.provider,
      providerPaymentId: payment.providerPaymentId ?? null,
      providerOrderId: payment.providerOrderId ?? null,
      expiresAt: Number(payment.expiresAt),
      inventoryReleasedAt: payment.inventoryReleasedAt
        ? Number(payment.inventoryReleasedAt)
        : null,
      referrerUserId: payment.referrerUserId ?? null,
      promoterUserId: payment.promoterUserId ?? null,
      fulfilledAt: payment.fulfilledAt ? Number(payment.fulfilledAt) : null,
      refundedAmount: paiseToRupees(payment.refundedAmount),
      createdAt: Number(payment.createdAt),
      updatedAt: Number(payment.updatedAt),
    };
  }

  private toResponse(
    payment: Payment,
    client?: PaymentClientPayload | null,
  ): PaymentResponseDto {
    const response: PaymentResponseDto = {
      id: payment.id,
      status: payment.status,
      amount: paiseToRupees(payment.amount),
      currency: PaymentConstants.CURRENCY,
      provider: payment.provider,
      failureCode: payment.failureCode ?? null,
      failureMessage: payment.failureMessage ?? null,
      createdAt: Number(payment.createdAt),
      updatedAt: Number(payment.updatedAt),
    };
    if (client !== undefined) {
      response.client = client;
    }
    return response;
  }
}
