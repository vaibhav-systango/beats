import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CreateEventDto } from '../../dto/create-event.dto';

export function UpdateEventSwagger() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update event metadata or stage revision (Shadow Copy Pattern)',
    }),
    ApiBearerAuth(),
    ApiParam({ name: 'id', description: 'Event ULID to update' }),
    ApiBody({
      type: CreateEventDto,
      examples: {
        'Update Event Shell': {
          value: {
            title: 'Updated Beat Festival 2026',
            slug: 'updated-beat-festival-2026',
            description: 'Updated description for the music festival.',

          },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Event updated directly (if draft/rejected) or staged in statusLog (if live/published).',
    }),
    ApiResponse({
      status: 400,
      description: 'Bad Request. Input validation failed.',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized.',
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden. Only organizer accounts associated with the event can edit it.',
    }),
    ApiResponse({
      status: 404,
      description: 'Not Found. Event not found.',
    }),
    ApiResponse({
      status: 409,
      description: 'Conflict. Event is currently locked for review.',
    }),
    ApiResponse({
      status: 429,
      description: 'Too Many Requests.',
    }),
    ApiResponse({
      status: 500,
      description: 'Internal Server Error.',
    }),
  );
}
