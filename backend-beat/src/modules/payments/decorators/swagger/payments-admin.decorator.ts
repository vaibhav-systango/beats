import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

export function AdminGetPaymentSwagger() {
  return applyDecorators(
    ApiOperation({
      summary: 'Admin payment debug graph',
      description:
        'Traces payment → tickets → splits/payouts → ledger. No secrets.',
    }),
    ApiBearerAuth(),
    ApiResponse({ status: 200, description: 'Payment financial graph' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Admin only' }),
    ApiResponse({ status: 404, description: 'Payment not found' }),
  );
}

export function AdminListPayoutsSwagger() {
  return applyDecorators(
    ApiOperation({ summary: 'Admin list payouts' }),
    ApiBearerAuth(),
    ApiResponse({ status: 200, description: 'Payout list' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Admin only' }),
  );
}

export function AdminRunSettlementSwagger() {
  return applyDecorators(
    ApiOperation({
      summary: 'Run simulated settlement',
      description:
        'Marks SCHEDULED payouts as PAID and records a settlement batch. Idempotent for already-paid payouts. Does not perform a real bank transfer.',
    }),
    ApiBearerAuth(),
    ApiResponse({ status: 200, description: 'Settlement batch result' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Admin only' }),
  );
}
