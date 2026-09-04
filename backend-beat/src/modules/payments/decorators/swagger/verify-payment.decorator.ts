import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { VerifyPaymentDto } from '../../dto/verify-payment.dto';
import { PaymentResponseDto } from '../../dto/payment-response.dto';

export function VerifyPaymentSwagger() {
  return applyDecorators(
    ApiOperation({
      summary: 'Verify a payment after client checkout',
      description:
        'Confirms payment with the active provider using a provider-agnostic payload. Webhooks remain the source of truth.',
    }),
    ApiBearerAuth(),
    ApiParam({ name: 'id', description: 'Payment ULID' }),
    ApiBody({ type: VerifyPaymentDto }),
    ApiResponse({
      status: 200,
      description: 'Updated payment status',
      type: PaymentResponseDto,
    }),
    ApiResponse({
      status: 400,
      description: 'Verification failed or provider mismatch',
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Not the payment owner' }),
    ApiResponse({ status: 404, description: 'Payment not found' }),
  );
}
