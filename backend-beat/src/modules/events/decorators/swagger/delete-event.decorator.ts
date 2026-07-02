import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

export function DeleteEventSwagger() {
  return applyDecorators(
    ApiOperation({ summary: 'Soft delete an event' }),
    ApiBearerAuth(),
    ApiParam({ name: 'id', description: 'Event ULID to delete' }),
    ApiResponse({
      status: 200,
      description: 'Event soft-deleted successfully.',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized.',
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden. Only organizer owners can delete events.',
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
