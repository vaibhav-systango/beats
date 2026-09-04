import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PaymentResponseDto } from '../../dto/payment-response.dto';

export function RefundPaymentSwagger() {
  return applyDecorators(
    ApiOperation({
      summary: 'Refund a successful payment',
      description:
        'Full refund only. Buyer or admin. Rejected if any payout for this payment is already PAID.',
    }),
    ApiBearerAuth(),
    ApiResponse({
      status: 200,
      description: 'Payment refunded',
      type: PaymentResponseDto,
    }),
    ApiResponse({ status: 400, description: 'Payment cannot be refunded' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Forbidden' }),
    ApiResponse({
      status: 409,
      description: 'A payout has already been settled',
    }),
    ApiResponse({ status: 404, description: 'Payment not found' }),
  );
}
