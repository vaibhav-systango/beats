import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PaymentMessages } from '../../constants/payments.constants';
import type {
  CreatePaymentInput,
  CreatePaymentResult,
  IPaymentProvider,
  NormalizedPaymentEvent,
  RefundPaymentInput,
  VerifyPaymentInput,
} from '../payment-provider.interface';

@Injectable()
export class StripePaymentProvider implements IPaymentProvider {
  readonly name = 'STRIPE';
  private readonly logger = new Logger(StripePaymentProvider.name);
  private readonly stripe: Stripe;
  private readonly webhookSecret: string;
  private readonly publishableKey: string;

  constructor(configService: ConfigService, stripeClient?: Stripe) {
    const secretKey =
      configService.get<string>('payment.stripe.secretKey') || '';
    this.webhookSecret =
      configService.get<string>('payment.stripe.webhookSecret') || '';
    this.publishableKey =
      configService.get<string>('payment.stripe.publishableKey') || '';
    this.stripe =
      stripeClient ?? new Stripe(secretKey || 'not-configured');
  }

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    if (!this.publishableKey) {
      throw new InternalServerErrorException(
        PaymentMessages.PROVIDER_NOT_CONFIGURED,
      );
    }

    try {
      const paymentIntent = await this.stripe.paymentIntents.create(
        {
          amount: input.amount,
          currency: input.currency.toLowerCase(),
          description: input.description,
          metadata: input.metadata,
          automatic_payment_methods: { enabled: true },
        },
        { idempotencyKey: input.idempotencyKey },
      );

      if (!paymentIntent.client_secret) {
        throw new InternalServerErrorException(
          PaymentMessages.UNEXPECTED_ERROR,
        );
      }

      return {
        providerOrderId: paymentIntent.id,
        providerPaymentId: paymentIntent.id,
        clientPayload: {
          provider: 'stripe',
          publishableKey: this.publishableKey,
          clientSecret: paymentIntent.client_secret,
        },
      };
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      this.logger.error('Stripe PaymentIntent create failed', error);
      throw new InternalServerErrorException(PaymentMessages.UNEXPECTED_ERROR);
    }
  }

  async verifyPayment(
    input: VerifyPaymentInput,
  ): Promise<NormalizedPaymentEvent> {
    const storedOrderId = input.providerOrderId;
    if (!storedOrderId) {
      throw new BadRequestException(PaymentMessages.VERIFY_FAILED);
    }

    const clientPaymentId = input.payload.providerPaymentId;
    const clientOrderId = input.payload.providerOrderId;
    if (clientPaymentId && clientPaymentId !== storedOrderId) {
      throw new BadRequestException(PaymentMessages.VERIFY_ORDER_MISMATCH);
    }
    if (clientOrderId && clientOrderId !== storedOrderId) {
      throw new BadRequestException(PaymentMessages.VERIFY_ORDER_MISMATCH);
    }

    try {
      const paymentIntent =
        await this.stripe.paymentIntents.retrieve(storedOrderId);
      return this.mapPaymentIntent(paymentIntent, `verify_${paymentIntent.id}`);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Stripe PaymentIntent retrieve failed', error);
      throw new BadRequestException(PaymentMessages.VERIFY_FAILED);
    }
  }

  async refundPayment(
    input: RefundPaymentInput,
  ): Promise<{ refundId: string }> {
    const refund = await this.stripe.refunds.create({
      payment_intent: input.providerPaymentId,
      amount: input.amount,
    });
    return { refundId: refund.id };
  }

  // Signature verification is synchronous; the interface is async for all adapters.
  // eslint-disable-next-line @typescript-eslint/require-await
  async parseWebhook(
    rawBody: Buffer,
    headers: Record<string, string>,
  ): Promise<NormalizedPaymentEvent | null> {
    if (!this.webhookSecret) {
      throw new InternalServerErrorException(
        PaymentMessages.PROVIDER_NOT_CONFIGURED,
      );
    }

    const signature = headers['stripe-signature'];
    if (!signature) {
      throw new BadRequestException(PaymentMessages.INVALID_WEBHOOK_SIGNATURE);
    }

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        this.webhookSecret,
      );
    } catch (error) {
      this.logger.warn(
        `Stripe webhook signature verification failed: ${
          error instanceof Error ? error.message : 'unknown'
        }`,
      );
      throw new BadRequestException(PaymentMessages.INVALID_WEBHOOK_SIGNATURE);
    }

    if (event.type === 'payment_intent.succeeded') {
      return this.mapPaymentIntent(
        event.data.object,
        event.id,
        'PAYMENT_SUCCEEDED',
      );
    }
    if (event.type === 'payment_intent.payment_failed') {
      return this.mapPaymentIntent(
        event.data.object,
        event.id,
        'PAYMENT_FAILED',
      );
    }
    if (event.type === 'payment_intent.canceled') {
      return this.mapPaymentIntent(
        event.data.object,
        event.id,
        'PAYMENT_CANCELLED',
      );
    }

    return null;
  }

  private mapPaymentIntent(
    paymentIntent: Stripe.PaymentIntent,
    providerEventId: string,
    forcedType?: NormalizedPaymentEvent['type'],
  ): NormalizedPaymentEvent {
    const type =
      forcedType ??
      (paymentIntent.status === 'succeeded'
        ? 'PAYMENT_SUCCEEDED'
        : paymentIntent.status === 'canceled'
          ? 'PAYMENT_CANCELLED'
          : paymentIntent.last_payment_error
            ? 'PAYMENT_FAILED'
            : 'PAYMENT_PENDING');

    return {
      type,
      provider: this.name,
      providerEventId,
      providerPaymentId: paymentIntent.id,
      providerOrderId: paymentIntent.id,
      paymentId: paymentIntent.metadata?.paymentId,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency?.toUpperCase(),
      failureCode: paymentIntent.last_payment_error?.code ?? undefined,
      failureMessage: paymentIntent.last_payment_error?.message ?? undefined,
    };
  }
}
