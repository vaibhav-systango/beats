import { PaymentStatus } from '../../../database/entities/payment.entity';

const TERMINAL: ReadonlySet<PaymentStatus> = new Set([
  PaymentStatus.FAILED,
  PaymentStatus.CANCELLED,
  PaymentStatus.REFUNDED,
]);

export function canTransition(from: PaymentStatus, to: PaymentStatus): boolean {
  if (from === to) {
    return true;
  }
  if (from === PaymentStatus.SUCCEEDED && to === PaymentStatus.REFUNDED) {
    return true;
  }
  if (from === PaymentStatus.FAILED && to === PaymentStatus.SUCCEEDED) {
    return true;
  }
  if (TERMINAL.has(from)) {
    return false;
  }
  if (from === PaymentStatus.SUCCEEDED) {
    return false;
  }
  if (
    from === PaymentStatus.CREATED &&
    (to === PaymentStatus.PENDING ||
      to === PaymentStatus.SUCCEEDED ||
      to === PaymentStatus.FAILED ||
      to === PaymentStatus.CANCELLED)
  ) {
    return true;
  }
  if (
    from === PaymentStatus.PENDING &&
    (to === PaymentStatus.SUCCEEDED ||
      to === PaymentStatus.FAILED ||
      to === PaymentStatus.CANCELLED)
  ) {
    return true;
  }
  return false;
}

export function eventTypeToStatus(
  type:
    | 'PAYMENT_PENDING'
    | 'PAYMENT_SUCCEEDED'
    | 'PAYMENT_FAILED'
    | 'PAYMENT_CANCELLED',
): PaymentStatus {
  switch (type) {
    case 'PAYMENT_PENDING':
      return PaymentStatus.PENDING;
    case 'PAYMENT_SUCCEEDED':
      return PaymentStatus.SUCCEEDED;
    case 'PAYMENT_FAILED':
      return PaymentStatus.FAILED;
    case 'PAYMENT_CANCELLED':
      return PaymentStatus.CANCELLED;
  }
}
