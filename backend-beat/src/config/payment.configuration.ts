import { registerAs } from '@nestjs/config';

function parsePlatformFeeBps(raw: string | undefined): number {
  const value = Number(raw ?? 0);
  if (
    !Number.isFinite(value) ||
    !Number.isInteger(value) ||
    value < 0 ||
    value > 10_000
  ) {
    throw new Error(
      'PAYMENT_PLATFORM_FEE_BPS must be an integer between 0 and 10000',
    );
  }
  return value;
}

function parseReservationTtlMs(raw: string | undefined): number {
  const value = Number(raw ?? 900_000);
  if (!Number.isFinite(value) || !Number.isInteger(value) || value <= 0) {
    throw new Error(
      'PAYMENT_RESERVATION_TTL_MS must be a positive integer (milliseconds)',
    );
  }
  return value;
}

export const paymentConfiguration = registerAs('payment', () => ({
  provider: (process.env.PAYMENT_PROVIDER || 'stripe').toLowerCase(),
  platformFeeBps: parsePlatformFeeBps(process.env.PAYMENT_PLATFORM_FEE_BPS),
  reservationTtlMs: parseReservationTtlMs(
    process.env.PAYMENT_RESERVATION_TTL_MS,
  ),
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
  },
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
  },
}));
