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
    ApiQuery({
      name: 'search',
      required: false,
      description: 'Search query string to search across title, description, artist, and venue',
      type: String,
    }),
    ApiQuery({
      name: 'city',
      required: false,
      description: 'Filter events by city',
      type: String,
    }),
    ApiQuery({
      name: 'category',
      required: false,
      description: 'Filter events by category name',
      type: String,
    }),
    ApiQuery({
      name: 'dateFrom',
      required: false,
      description: 'Filter sessions starting after this timestamp (Unix milliseconds)',
      type: Number,
    }),
    ApiQuery({
      name: 'dateTo',
      required: false,
      description: 'Filter sessions starting before this timestamp (Unix milliseconds)',
      type: Number,
    }),
    ApiQuery({
      name: 'language',
      required: false,
      description: 'Filter events by language',
      type: String,
    }),
    ApiQuery({
      name: 'lat',
      required: false,
      description: 'Latitude for geo-distance search',
      type: Number,
    }),
    ApiQuery({
      name: 'lng',
      required: false,
      description: 'Longitude for geo-distance search',
      type: Number,
    }),
    ApiQuery({
      name: 'radius',
      required: false,
      description: 'Radius for geo-distance search (e.g. 20km)',
      type: String,
    }),
    ApiQuery({
      name: 'minPrice',
      required: false,
      description: 'Minimum ticket price in rupees',
      type: Number,
    }),
    ApiQuery({
      name: 'maxPrice',
      required: false,
      description: 'Maximum ticket price in rupees',
      type: Number,
    }),
    ApiQuery({
      name: 'mode',
      required: false,
      description: 'Filter sessions by mode (OFFLINE, ONLINE, HYBRID)',
      type: String,
    }),
    ApiResponse({
      status: 200,
      description: 'Public event search discovery feed retrieved successfully.',
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
