export const PAYMENT_PROVIDER = 'PAYMENT_PROVIDER';

export type PaymentEventType =
  | 'PAYMENT_PENDING'
  | 'PAYMENT_SUCCEEDED'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_CANCELLED';

export interface PaymentClientPayload {
  provider: string;
  [key: string]: string | number;
}

export interface CreatePaymentInput {
  paymentId: string;
  amount: number;
  currency: string;
  customer: { userId: string; email?: string; phone?: string };
  description: string;
  metadata: Record<string, string>;
  idempotencyKey: string;
}

export interface CreatePaymentResult {
  providerPaymentId?: string;
  providerOrderId: string;
  clientPayload: PaymentClientPayload;
}

export interface VerifyPaymentPayload {
  providerPaymentId?: string;
  providerOrderId?: string;
  signature?: string;
}

export interface VerifyPaymentInput {
  providerOrderId: string;
  payload: VerifyPaymentPayload;
}

export interface RefundPaymentInput {
  providerPaymentId: string;
  amount?: number;
}

export interface NormalizedPaymentEvent {
  type: PaymentEventType;
  provider: string;
  providerEventId: string;
  providerPaymentId?: string;
  providerOrderId?: string;
  paymentId?: string;
  amount?: number;
  currency?: string;
  failureCode?: string;
  failureMessage?: string;
}

export interface IPaymentProvider {
  readonly name: string;
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  verifyPayment(input: VerifyPaymentInput): Promise<NormalizedPaymentEvent>;
  refundPayment(input: RefundPaymentInput): Promise<{ refundId: string }>;
  parseWebhook(
    rawBody: Buffer,
    headers: Record<string, string>,
  ): Promise<NormalizedPaymentEvent | null>;
}
