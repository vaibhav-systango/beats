import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { CreatePaymentDto } from '../../dto/create-payment.dto';
import { PaymentResponseDto } from '../../dto/payment-response.dto';

export function CreatePaymentSwagger() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create a payment for ticket types',
      description:
        'Holds inventory, prices ticket lines from the catalog (never from the client amount), creates a provider payment, and returns checkout client payload. Free tickets (amount 0) succeed immediately without a provider call. Repeat requests with the same idempotencyKey return the original payment. referrerUserId / promoterUserId are required only when those split legs apply.',
    }),
    ApiBearerAuth(),
    ApiBody({ type: CreatePaymentDto }),
    ApiResponse({
      status: 201,
      description: 'Payment created',
      type: PaymentResponseDto,
    }),
    ApiResponse({
      status: 400,
      description: 'Invalid tickets, sales closed, or unpublished event',
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({
      status: 404,
      description: 'Ticket type or session not found',
    }),
    ApiResponse({ status: 409, description: 'Insufficient inventory' }),
    ApiResponse({ status: 500, description: 'Unexpected server error' }),
  );
}
