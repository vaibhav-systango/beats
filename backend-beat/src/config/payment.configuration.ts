import { registerAs } from '@nestjs/config';

export const paymentConfiguration = registerAs('payment', () => ({
  provider: (process.env.PAYMENT_PROVIDER || 'stripe').toLowerCase(),
  platformFeeBps: Number(process.env.PAYMENT_PLATFORM_FEE_BPS || 0),
  reservationTtlMs: Number(process.env.PAYMENT_RESERVATION_TTL_MS || 900_000),
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
