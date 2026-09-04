export const PaymentMessages = {
  UNEXPECTED_ERROR: 'An unexpected error occurred. Please try again later.',
  NOT_FOUND: 'Payment not found.',
  FORBIDDEN: 'You are not authorized to access this payment.',
  PROVIDER_MISMATCH:
    'This payment belongs to a different provider than the one currently configured.',
  WEBHOOK_PROVIDER_INACTIVE:
    'This webhook provider is not the active payment provider.',
  INVALID_WEBHOOK_SIGNATURE: 'Invalid webhook signature.',
  MISSING_RAW_BODY: 'Webhook raw body is required.',
  AMOUNT_MISMATCH: 'Payment amount does not match the recorded amount.',
  PROVIDER_NOT_CONFIGURED: 'Payment provider credentials are not configured.',
  VERIFY_FAILED: 'Payment verification failed.',
  DUPLICATE_TICKET_TYPE:
    'Duplicate ticket types are not allowed in one payment.',
  REFERRER_REQUIRED:
    'A referrer is required because a selected session has referral rewards enabled.',
  REFERRER_INVALID: 'The referrer is invalid.',
  PROMOTER_REQUIRED:
    'A promoter is required because a selected session has promoter commission enabled.',
  PROMOTER_INVALID: 'The promoter is invalid.',
  REFUND_NOT_ALLOWED: 'This payment cannot be refunded.',
  REFUND_FAILED: 'Payment refund failed.',
  REFUND_PAYOUT_PAID:
    'This payment cannot be refunded because a payout has already been settled.',
  ADMIN_ONLY: 'Only admin accounts can access this resource.',
  CURRENCY_MISMATCH: 'Only INR payments are supported.',
};

export const PaymentConstants = {
  CREATE_LIMIT: 10,
  CREATE_TTL_MS: 60000,
  CURRENCY: 'INR',
};
