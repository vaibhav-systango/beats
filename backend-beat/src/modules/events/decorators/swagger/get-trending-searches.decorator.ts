import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function GetTrendingSearchesSwagger() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get trending search terms',
    }),
    ApiResponse({
      status: 200,
      description: 'Trending search terms retrieved successfully.',
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
