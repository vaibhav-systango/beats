import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CreateEventDto } from '../../dto/create-event.dto';

export function CreateEventSwagger() {
  return applyDecorators(
    ApiOperation({ summary: 'Create a new event shell metadata' }),
    ApiBearerAuth(),
    ApiBody({
      type: CreateEventDto,
      examples: {
        'Create Event Shell': {
          value: {
            title: 'Beat Festival 2026',
            slug: 'beat-festival-2026',
            description: 'Massive electronic music festival in California.',

          },
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Event created successfully.',
    }),
    ApiResponse({
      status: 400,
      description: 'Bad Request. Input validation failed.',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized. Missing or invalid Bearer token.',
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden. Only organizer accounts can create events.',
    }),
    ApiResponse({
      status: 429,
      description: 'Too Many Requests. Creation limits exceeded.',
    }),
    ApiResponse({
      status: 500,
      description: 'Internal Server Error.',
    }),
  );
}
