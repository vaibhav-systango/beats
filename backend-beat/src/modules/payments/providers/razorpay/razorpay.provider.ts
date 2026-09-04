import { createHmac, timingSafeEqual } from 'crypto';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Razorpay from 'razorpay';
import { PaymentMessages } from '../../constants/payments.constants';
import type {
  CreatePaymentInput,
  CreatePaymentResult,
  IPaymentProvider,
  NormalizedPaymentEvent,
  RefundPaymentInput,
  VerifyPaymentInput,
} from '../payment-provider.interface';

interface RazorpayOrder {
  id: string;
  amount: number | string;
  currency: string;
}

interface RazorpayWebhookPayload {
  event?: string;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        order_id?: string;
        amount?: number;
        currency?: string;
        status?: string;
        error_code?: string | null;
        error_description?: string | null;
        notes?: Record<string, string>;
      };
    };
    order?: {
      entity?: {
        id?: string;
        amount?: number;
        currency?: string;
        notes?: Record<string, string>;
      };
    };
  };
}

@Injectable()
export class RazorpayPaymentProvider implements IPaymentProvider {
  readonly name = 'RAZORPAY';
  private readonly logger = new Logger(RazorpayPaymentProvider.name);
  private readonly client: Razorpay;
  private readonly keyId: string;
  private readonly keySecret: string;
  private readonly webhookSecret: string;

  constructor(configService: ConfigService, client?: Razorpay) {
    this.keyId = configService.get<string>('payment.razorpay.keyId') || '';
    this.keySecret =
      configService.get<string>('payment.razorpay.keySecret') || '';
    this.webhookSecret =
      configService.get<string>('payment.razorpay.webhookSecret') || '';
    this.client =
      client ??
      new Razorpay({
        key_id: this.keyId || 'not-configured',
        key_secret: this.keySecret || 'not-configured',
      });
  }

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    if (!this.keyId || !this.keySecret) {
      throw new InternalServerErrorException(
        PaymentMessages.PROVIDER_NOT_CONFIGURED,
      );
    }

    try {
      const order = (await this.client.orders.create({
        amount: input.amount,
        currency: input.currency,
        receipt: input.paymentId,
        notes: input.metadata,
      })) as RazorpayOrder;

      return {
        providerOrderId: order.id,
        clientPayload: {
          provider: 'razorpay',
          keyId: this.keyId,
          orderId: order.id,
          amount: input.amount,
          currency: input.currency,
        },
      };
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      this.logger.error('Razorpay order create failed', error);
      throw new InternalServerErrorException(PaymentMessages.UNEXPECTED_ERROR);
    }
  }

  // Signature verification is synchronous; the interface is async for all adapters.
  // eslint-disable-next-line @typescript-eslint/require-await
  async verifyPayment(
    input: VerifyPaymentInput,
  ): Promise<NormalizedPaymentEvent> {
    const paymentId = input.payload.providerPaymentId;
    const orderId = input.payload.providerOrderId || input.providerOrderId;
    const signature = input.payload.signature;

    if (!paymentId || !orderId || !signature || !this.keySecret) {
      throw new BadRequestException(PaymentMessages.VERIFY_FAILED);
    }

    const expected = createHmac('sha256', this.keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    if (!safeEqual(expected, signature)) {
      throw new BadRequestException(PaymentMessages.VERIFY_FAILED);
    }

    return {
      type: 'PAYMENT_SUCCEEDED',
      provider: this.name,
      providerEventId: `verify_${paymentId}`,
      providerPaymentId: paymentId,
      providerOrderId: orderId,
    };
  }

  async refundPayment(
    input: RefundPaymentInput,
  ): Promise<{ refundId: string }> {
    const refund = await this.client.payments.refund(input.providerPaymentId, {
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

    const signature = headers['x-razorpay-signature'];
    if (!signature) {
      throw new BadRequestException(PaymentMessages.INVALID_WEBHOOK_SIGNATURE);
    }

    const body = rawBody.toString('utf8');
    const expected = createHmac('sha256', this.webhookSecret)
      .update(body)
      .digest('hex');

    if (!safeEqual(expected, signature)) {
      this.logger.warn('Razorpay webhook signature verification failed');
      throw new BadRequestException(PaymentMessages.INVALID_WEBHOOK_SIGNATURE);
    }

    let payload: RazorpayWebhookPayload;
    try {
      payload = JSON.parse(body) as RazorpayWebhookPayload;
    } catch {
      throw new BadRequestException(PaymentMessages.INVALID_WEBHOOK_SIGNATURE);
    }

    const payment = payload.payload?.payment?.entity;
    const order = payload.payload?.order?.entity;
    const eventName = payload.event ?? '';

    if (eventName === 'payment.captured') {
      return {
        type: 'PAYMENT_SUCCEEDED',
        provider: this.name,
        providerEventId: `${eventName}_${payment?.id ?? order?.id ?? 'unknown'}`,
        providerPaymentId: payment?.id,
        providerOrderId: payment?.order_id ?? order?.id,
        paymentId: payment?.notes?.paymentId ?? order?.notes?.paymentId,
        amount: payment?.amount,
        currency: payment?.currency,
      };
    }

    if (eventName === 'order.paid') {
      return {
        type: 'PAYMENT_SUCCEEDED',
        provider: this.name,
        providerEventId: `${eventName}_${order?.id ?? payment?.id ?? 'unknown'}`,
        providerPaymentId: payment?.id,
        providerOrderId: order?.id ?? payment?.order_id,
        paymentId: order?.notes?.paymentId ?? payment?.notes?.paymentId,
        amount: order?.amount ?? payment?.amount,
        currency: order?.currency ?? payment?.currency,
      };
    }

    if (eventName === 'payment.failed') {
      return {
        type: 'PAYMENT_FAILED',
        provider: this.name,
        providerEventId: `${eventName}_${payment?.id ?? 'unknown'}`,
        providerPaymentId: payment?.id,
        providerOrderId: payment?.order_id,
        paymentId: payment?.notes?.paymentId,
        amount: payment?.amount,
        currency: payment?.currency,
        failureCode: payment?.error_code ?? undefined,
        failureMessage: payment?.error_description ?? undefined,
      };
    }

    return null;
  }
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}
