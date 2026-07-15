import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { SessionTicketsResponseDto } from '../../dto/session-tickets-response.dto';

export function GetSessionTicketsSwagger() {
  return applyDecorators(
    ApiOperation({
      summary:
        'Get ACTIVE ticket types for an event session (Get Tickets)',
      description:
        'Returns purchasable ACTIVE ticket types for the given session, sorted by price ascending. Public endpoint. Cancelled or completed sessions return 404.',
    }),
    ApiParam({
      name: 'sessionId',
      description: 'Event session ULID',
      example: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
    }),
    ApiResponse({
      status: 200,
      description: 'Session ticket types (may be an empty tickets array)',
      type: SessionTicketsResponseDto,
    }),
    ApiResponse({
      status: 404,
      description:
        'Session not found, deleted, cancelled, or completed',
    }),
    ApiResponse({
      status: 500,
      description: 'Unexpected server error',
    }),
  );
}
