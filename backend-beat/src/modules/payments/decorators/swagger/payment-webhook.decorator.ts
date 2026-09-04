import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

export function PaymentWebhookSwagger() {
  return applyDecorators(
    ApiOperation({
      summary: 'Provider webhook',
      description:
        'Verifies the provider signature on the raw body, normalizes the event, and updates payment status. No JWT. Subscribe Stripe or Razorpay to this URL.',
    }),
    ApiParam({
      name: 'provider',
      enum: ['stripe', 'razorpay'],
      description: 'Must match the configured PAYMENT_PROVIDER',
    }),
    ApiResponse({ status: 200, description: 'Event accepted' }),
    ApiResponse({
      status: 400,
      description: 'Invalid signature or inactive provider',
    }),
  );
}
