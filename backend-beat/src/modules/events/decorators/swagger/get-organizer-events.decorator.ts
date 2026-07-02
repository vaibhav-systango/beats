import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

export function GetOrganizerEventsSwagger() {
  return applyDecorators(
    ApiOperation({ summary: 'Retrieve all events created by the logged-in organizer' }),
    ApiBearerAuth(),
    ApiResponse({
      status: 200,
      description: 'List of organizer events retrieved successfully.',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized.',
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden. Only organizer accounts can view their events.',
    }),
    ApiResponse({
      status: 500,
      description: 'Internal Server Error.',
    }),
  );
}
