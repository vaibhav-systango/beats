import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';

import {
  AdminEventsListFilter,
  AdminPendingEventsResponseDto,
} from '../../dto/admin-pending-events.dto';

export function GetAdminEventsSwagger() {
  return applyDecorators(
    ApiOperation({
      summary: 'List admin events filtered by review status (paginated)',
    }),
    ApiBearerAuth(),
    ApiQuery({
      name: 'status',
      required: true,
      description:
        'PENDING_APPROVAL, PUBLISHED, REJECTED, APPROVED, or ACCEPTED (PUBLISHED + APPROVED)',
      enum: AdminEventsListFilter,
      example: AdminEventsListFilter.PENDING_APPROVAL,
    }),
    ApiQuery({
      name: 'page',
      required: false,
      description: 'Page number (default: 1)',
      type: Number,
      example: 1,
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      description: 'Items per page (default: 20, max: 100)',
      type: Number,
      example: 20,
    }),
    ApiResponse({
      status: 200,
      description: 'Paginated list of admin events for the given status filter.',
      type: AdminPendingEventsResponseDto,
    }),
    ApiResponse({
      status: 400,
      description: 'Bad Request. Invalid status filter.',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized.',
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden. Only admin accounts can view events.',
    }),
    ApiResponse({
      status: 500,
      description: 'Internal Server Error.',
    }),
  );
}
