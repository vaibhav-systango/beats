import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';

export function GetSuggestionsSwagger() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get autocomplete search suggestions for events',
    }),
    ApiQuery({
      name: 'q',
      required: false,
      description: 'Partial search query string for autocomplete',
      type: String,
      example: 'jazz',
    }),
    ApiResponse({
      status: 200,
      description: 'Autocomplete suggestions retrieved successfully.',
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
