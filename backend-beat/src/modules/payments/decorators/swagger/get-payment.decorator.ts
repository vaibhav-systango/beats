import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { PaymentResponseDto } from '../../dto/payment-response.dto';

export function GetPaymentSwagger() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get payment status',
      description:
        'Returns the current payment record. Does not include provider client secrets.',
    }),
    ApiBearerAuth(),
    ApiParam({ name: 'id', description: 'Payment ULID' }),
    ApiResponse({
      status: 200,
      description: 'Payment',
      type: PaymentResponseDto,
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Not the payment owner' }),
    ApiResponse({ status: 404, description: 'Payment not found' }),
  );
}
