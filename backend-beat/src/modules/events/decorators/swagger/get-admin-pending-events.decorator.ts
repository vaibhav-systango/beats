import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';

import { AdminPendingEventsResponseDto } from '../../dto/admin-pending-events.dto';

export function GetAdminPendingEventsSwagger() {
  return applyDecorators(
    ApiOperation({ summary: 'List events pending admin approval (paginated)' }),
    ApiBearerAuth(),
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
      description: 'Paginated list of pending approval events.',
      type: AdminPendingEventsResponseDto,
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized.',
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden. Only admin accounts can view pending events.',
    }),
    ApiResponse({
      status: 500,
      description: 'Internal Server Error.',
    }),
  );
}
