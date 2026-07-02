import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

export function CancelEventSwagger() {
  return applyDecorators(
    ApiOperation({ summary: 'Emergency cancel a live show' }),
    ApiBearerAuth(),
    ApiParam({ name: 'id', description: 'Event ULID to cancel' }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          adminId: { type: 'string', description: 'Admin ULID' },
          reason: { type: 'string', description: 'Emergency cancel reason' },
        },
        required: ['adminId', 'reason'],
      },
      examples: {
        'Cancel Show': {
          value: {
            adminId: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
            reason: 'Severe weather alert in the festival area.',
          },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Event and associated sessions cancelled immediately. Ticket bookings closed.',
    }),
    ApiResponse({
      status: 400,
      description: 'Bad Request. Cancel reason is missing.',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized.',
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden. Only admin accounts can cancel events.',
    }),
    ApiResponse({
      status: 404,
      description: 'Not Found. Event not found.',
    }),
    ApiResponse({
      status: 500,
      description: 'Internal Server Error.',
    }),
  );
}
