import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';

export function CreateSessionSwagger() {
  return applyDecorators(
    ApiOperation({ summary: 'Add a new session to an existing event' }),
    ApiBearerAuth(),
    ApiConsumes('multipart/form-data'),
    ApiParam({ name: 'eventId', description: 'Event ULID to attach the session to' }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          categoryIds: { type: 'array', items: { type: 'string' }, description: 'Array of category ULIDs for this session', example: ['01ARZ3NDEKTSV4RRFFQ69G5FAV'] },
          title: { type: 'string', description: 'Session title', example: 'Day 1 Mainstage' },
          startAt: { type: 'integer', description: 'Start time timestamp', example: 1774872000000 },
          endAt: { type: 'integer', description: 'End time timestamp', example: 1774908000000 },
          location: {
            type: 'object',
            properties: {
              longitude: { type: 'number', example: -116.35338 },
              latitude: { type: 'number', example: 33.6803 },
            },
          },
          eventAddress: {
            type: 'object',
            properties: {
              formattedAddress: { type: 'string', example: 'Empire Polo Club, Indio, CA' },
              city: { type: 'string', example: 'Indio' },
              state: { type: 'string', example: 'CA' },
              country: { type: 'string', example: 'USA' },
              postalCode: { type: 'string', example: '92201' },
            },
          },
          capacity: { type: 'integer', example: 5000 },
          ageRestriction: { type: 'string', enum: ['ALL', '13_PLUS', '16_PLUS', '18_PLUS', '21_PLUS'], example: '18_PLUS' },
          languages: { type: 'array', items: { type: 'string' }, example: ['English'] },
          mode: { type: 'string', enum: ['OFFLINE', 'ONLINE', 'HYBRID'], example: 'OFFLINE' },
          ticketSaleStartAt: { type: 'integer', example: 1774868400000 },
          ticketSaleEndAt: { type: 'integer', example: 1774872000000 },
          allowReferral: { type: 'boolean', example: true },
          referralRewardPerTicket: { type: 'number', example: 10 },
          allowPromoters: { type: 'boolean', example: true },
          promoterCommissionPercentage: { type: 'number', example: 5.5 },
          priority: { type: 'boolean', description: 'Enable priority pinning to show the event at the top of feeds', example: true },
          artistMetadata: {
            type: 'object',
            properties: {
              name: { type: 'string', example: 'Eric Prydz' },
              socialMediaUrl: { type: 'string', example: 'https://instagram.com/ericprydz' },
              category: { type: 'string', example: 'music' },
            },
          },
          ticketTypes: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string', example: 'General Admission' },
                description: { type: 'string', example: 'Access to mainstage.' },
                price: { type: 'number', example: 15000 },
                quantity: { type: 'number', example: 4000 },
                maxPurchaseLimit: { type: 'number', example: 10 },
                saleStartAt: { type: 'number', example: 1774868400000 },
                saleEndAt: { type: 'number', example: 1774872000000 },
              },
            },
          },
          cover: {
            type: 'string',
            format: 'binary',
            description: 'Cover Image File',
          },
          gallery: {
            type: 'array',
            items: { type: 'string', format: 'binary' },
            description: 'Gallery Images Files',
          },
          venueGallery: {
            type: 'array',
            items: { type: 'string', format: 'binary' },
            description: 'Venue Gallery Images Files',
          },
          videos: {
            type: 'array',
            items: { type: 'string', format: 'binary' },
            description: 'Videos Files',
          },
          documents: {
            type: 'array',
            items: { type: 'string', format: 'binary' },
            description: 'General Documents Files',
          },
          legalDocuments: {
            type: 'array',
            items: { type: 'string', format: 'binary' },
            description: 'Legal Policy Documents Files',
          },
        },
        required: ['categoryIds', 'title', 'startAt', 'endAt', 'location', 'eventAddress', 'capacity', 'ticketSaleStartAt', 'ticketSaleEndAt', 'ticketTypes'],
      },
    }),
    ApiResponse({ status: 201, description: 'Session created successfully.' }),
    ApiResponse({ status: 400, description: 'Bad Request. Temporal, capacity, or marketing rules validation failed.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
    ApiResponse({ status: 403, description: 'Forbidden. Only the organizer who owns the event can add sessions.' }),
    ApiResponse({ status: 404, description: 'Not Found. Event not found.' }),
    ApiResponse({ status: 500, description: 'Internal Server Error.' }),
  );
}

export function UpdateSessionSwagger() {
  return applyDecorators(
    ApiOperation({ summary: 'Update details and ticket types of an existing session' }),
    ApiBearerAuth(),
    ApiConsumes('multipart/form-data'),
    ApiParam({ name: 'eventId', description: 'Event ULID' }),
    ApiParam({ name: 'sessionId', description: 'Session ULID to update' }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          categoryIds: { type: 'array', items: { type: 'string' }, description: 'Array of category ULIDs for this session', example: ['01ARZ3NDEKTSV4RRFFQ69G5FAV'] },
          title: { type: 'string', example: 'Day 1 Mainstage - Updated' },
          startAt: { type: 'integer', example: 1774872000000 },
          endAt: { type: 'integer', example: 1774908000000 },
          location: {
            type: 'object',
            properties: {
              longitude: { type: 'number', example: -116.35338 },
              latitude: { type: 'number', example: 33.6803 },
            },
          },
          eventAddress: {
            type: 'object',
            properties: {
              formattedAddress: { type: 'string', example: 'Empire Polo Club, Indio, CA' },
              city: { type: 'string', example: 'Indio' },
              state: { type: 'string', example: 'CA' },
              country: { type: 'string', example: 'USA' },
              postalCode: { type: 'string', example: '92201' },
            },
          },
          capacity: { type: 'integer', example: 6000 },
          ageRestriction: { type: 'string', enum: ['ALL', '13_PLUS', '16_PLUS', '18_PLUS', '21_PLUS'], example: '18_PLUS' },
          languages: { type: 'array', items: { type: 'string' }, example: ['English', 'Spanish'] },
          mode: { type: 'string', enum: ['OFFLINE', 'ONLINE', 'HYBRID'], example: 'OFFLINE' },
          ticketSaleStartAt: { type: 'integer', example: 1774868400000 },
          ticketSaleEndAt: { type: 'integer', example: 1774872000000 },
          allowReferral: { type: 'boolean', example: true },
          referralRewardPerTicket: { type: 'number', example: 15 },
          allowPromoters: { type: 'boolean', example: true },
          promoterCommissionPercentage: { type: 'number', example: 6.0 },
          priority: { type: 'boolean', description: 'Enable priority pinning to show the event at the top of feeds', example: true },
          artistMetadata: {
            type: 'object',
            properties: {
              name: { type: 'string', example: 'Eric Prydz & Deadmau5' },
              socialMediaUrl: { type: 'string', example: 'https://instagram.com/ericprydz' },
              category: { type: 'string', example: 'music' },
            },
          },
          ticketTypes: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', description: 'Ticket Type ULID (leave blank to create a new ticket)', example: '01CHZ3NDEKTSV4RRFFQ69G5T1A' },
                name: { type: 'string', example: 'General Admission - Phase 2' },
                description: { type: 'string', example: 'Access to mainstage.' },
                price: { type: 'number', example: 18000 },
                quantity: { type: 'number', example: 4500 },
                maxPurchaseLimit: { type: 'number', example: 8 },
                saleStartAt: { type: 'number', example: 1774868400000 },
                saleEndAt: { type: 'number', example: 1774872000000 },
              },
            },
          },
          cover: {
            type: 'string',
            format: 'binary',
            description: 'Cover Image File',
          },
          gallery: {
            type: 'array',
            items: { type: 'string', format: 'binary' },
            description: 'Gallery Images Files',
          },
          venueGallery: {
            type: 'array',
            items: { type: 'string', format: 'binary' },
            description: 'Venue Gallery Images Files',
          },
          videos: {
            type: 'array',
            items: { type: 'string', format: 'binary' },
            description: 'Videos Files',
          },
          documents: {
            type: 'array',
            items: { type: 'string', format: 'binary' },
            description: 'General Documents Files',
          },
          legalDocuments: {
            type: 'array',
            items: { type: 'string', format: 'binary' },
            description: 'Legal Policy Documents Files',
          },
        },
      },
    }),
    ApiResponse({ status: 200, description: 'Session updated successfully.' }),
    ApiResponse({ status: 400, description: 'Bad Request. Temporal/capacity validation error.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
    ApiResponse({ status: 403, description: 'Forbidden.' }),
    ApiResponse({ status: 404, description: 'Not Found. Event or session not found.' }),
    ApiResponse({ status: 500, description: 'Internal Server Error.' }),
  );
}

export function DeleteSessionSwagger() {
  return applyDecorators(
    ApiOperation({ summary: 'Soft delete an event session and its ticket types' }),
    ApiBearerAuth(),
    ApiParam({ name: 'eventId', description: 'Event ULID' }),
    ApiParam({ name: 'sessionId', description: 'Session ULID to delete' }),
    ApiResponse({ status: 200, description: 'Session soft deleted successfully.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
    ApiResponse({ status: 403, description: 'Forbidden.' }),
    ApiResponse({ status: 404, description: 'Not Found. Event or session not found.' }),
    ApiResponse({ status: 500, description: 'Internal Server Error.' }),
  );
}

export function GetEventSessionsSwagger() {
  return applyDecorators(
    ApiOperation({ summary: 'List all sessions associated with a specific event' }),
    ApiBearerAuth(),
    ApiParam({ name: 'eventId', description: 'Event ULID' }),
    ApiResponse({ status: 200, description: 'List of sessions returned successfully.' }),
    ApiResponse({ status: 404, description: 'Not Found.' }),
    ApiResponse({ status: 500, description: 'Internal Server Error.' }),
  );
}
