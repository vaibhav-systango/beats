import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

export function GetPublicDiscoverySwagger() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get public search and discovery feed (status=PUBLISHED, active operational sessions only)',
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      description: 'Number of events to retrieve',
      type: Number,
      example: 10,
    }),
    ApiQuery({
      name: 'offset',
      required: false,
      description: 'Offset/skip count for pagination',
      type: Number,
      example: 0,
    }),
    ApiResponse({
      status: 200,
      description: 'Public event search discovery feed feed retrieved successfully.',
    }),
    ApiResponse({
      status: 429,
      description: 'Too Many Requests. Discovery query thresholds exceeded.',
    }),
    ApiResponse({
      status: 500,
      description: 'Internal Server Error.',
    }),
  );
}
