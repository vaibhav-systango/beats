import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

export function GetEventDetailsSwagger() {
  return applyDecorators(
    ApiOperation({ summary: 'Get full event details (including categories, sessions, ticket types)' }),
    ApiParam({ name: 'id', description: 'Event ULID to retrieve' }),
    ApiResponse({
      status: 200,
      description: 'Event details retrieved successfully.',
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
