import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

export function SubmitEventSwagger() {
  return applyDecorators(
    ApiOperation({
      summary: 'Submit a draft or rejected event for administrative review',
    }),
    ApiBearerAuth(),
    ApiParam({ name: 'id', description: 'Event ULID to submit' }),
    ApiResponse({
      status: 200,
      description: 'Event submitted successfully.',
    }),
    ApiResponse({
      status: 400,
      description: 'Bad Request. Database validation failed (e.g. event has no sessions, no cover image, or pricing rules are invalid).',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized.',
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden. Only the organizer who owns this event can submit it.',
    }),
    ApiResponse({
      status: 404,
      description: 'Not Found. Event not found.',
    }),
    ApiResponse({
      status: 409,
      description: 'Conflict. Event is already pending approval or published.',
    }),
    ApiResponse({
      status: 500,
      description: 'Internal Server Error.',
    }),
  );
}
