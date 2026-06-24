import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { CreateEventCategoryDto } from '../../dto/create-event-category.dto';
import { UpdateEventCategoryDto } from '../../dto/update-event-category.dto';
import { EventCategoryResponseDto } from '../../dto/event-category-response.dto';

export function CreateEventCategorySwagger() {
  return applyDecorators(
    ApiOperation({ summary: 'Create an event category' }),
    ApiBody({
      type: CreateEventCategoryDto,
      examples: {
        'Valid Request': {
          value: {
            name: 'Music',
            description: 'Live music concerts and festivals',
          },
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Event category created successfully',
      type: EventCategoryResponseDto,
    }),
    ApiResponse({ status: 400, description: 'Bad Request' }),
    ApiResponse({ status: 409, description: 'Category name already exists' }),
    ApiResponse({ status: 500, description: 'Internal Server Error' }),
  );
}

export function GetEventCategoriesSwagger() {
  return applyDecorators(
    ApiOperation({ summary: 'List all event categories' }),
    ApiQuery({ name: 'limit', required: false, example: 20, description: 'Number of records to return (default: 20, max: 100)' }),
    ApiQuery({ name: 'offset', required: false, example: 0, description: 'Number of records to skip (default: 0)' }),
    ApiResponse({
      status: 200,
      description: 'Event categories retrieved successfully',
      schema: {
        example: {
          data: [{ id: '01ARZ3NDEKTSV4RRFFQ69G5FAV', name: 'Music', description: 'Live music concerts', createdAt: '2026-06-23T10:00:00.000Z', updatedAt: '2026-06-23T10:00:00.000Z' }],
          total: 50,
          limit: 20,
          offset: 0,
        },
      },
    }),
    ApiResponse({ status: 500, description: 'Internal Server Error' }),
  );
}

export function GetEventCategorySwagger() {
  return applyDecorators(
    ApiOperation({ summary: 'Get an event category by ID' }),
    ApiParam({ name: 'id', description: 'Event category ULID' }),
    ApiResponse({
      status: 200,
      description: 'Event category retrieved successfully',
      type: EventCategoryResponseDto,
    }),
    ApiResponse({ status: 404, description: 'Category not found' }),
    ApiResponse({ status: 500, description: 'Internal Server Error' }),
  );
}

export function UpdateEventCategorySwagger() {
  return applyDecorators(
    ApiOperation({ summary: 'Update an event category' }),
    ApiParam({ name: 'id', description: 'Event category ULID' }),
    ApiBody({
      type: UpdateEventCategoryDto,
      examples: {
        'Valid Request': {
          value: {
            name: 'Music & Concerts',
            description: 'Updated description',
          },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Event category updated successfully',
      type: EventCategoryResponseDto,
    }),
    ApiResponse({ status: 400, description: 'Bad Request' }),
    ApiResponse({ status: 404, description: 'Category not found' }),
    ApiResponse({ status: 409, description: 'Category name already exists' }),
    ApiResponse({ status: 500, description: 'Internal Server Error' }),
  );
}

export function DeleteEventCategorySwagger() {
  return applyDecorators(
    ApiOperation({ summary: 'Delete an event category' }),
    ApiParam({ name: 'id', description: 'Event category ULID' }),
    ApiResponse({
      status: 200,
      description: 'Event category deleted successfully',
    }),
    ApiResponse({ status: 404, description: 'Category not found' }),
    ApiResponse({
      status: 409,
      description: 'Category is assigned to events',
    }),
    ApiResponse({ status: 500, description: 'Internal Server Error' }),
  );
}
