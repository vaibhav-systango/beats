import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewEventDto, ReviewAction } from '../../dto/review-event.dto';

export function ReviewEventSwagger() {
  return applyDecorators(
    ApiOperation({ summary: 'Review (APPROVE/REJECT) event initial submission or staged revision' }),
    ApiBearerAuth(),
    ApiParam({ name: 'id', description: 'Event ULID to review' }),
    ApiBody({
      type: ReviewEventDto,
      examples: {
        'Approve Event': {
          value: {
            action: ReviewAction.APPROVE,
            adminId: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
            reason: 'Meets all structural guidelines.',
          },
        },
        'Reject Event': {
          value: {
            action: ReviewAction.REJECT,
            adminId: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
            reason: 'Media resolution is too low.',
          },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Event review registered successfully. Staged revisions are merged if approved.',
    }),
    ApiResponse({
      status: 400,
      description: 'Bad Request. Rejection reason is missing.',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized.',
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden. Only admin accounts can review events.',
    }),
    ApiResponse({
      status: 404,
      description: 'Not Found. Event not found.',
    }),
    ApiResponse({
      status: 409,
      description: 'Conflict. Lock conflict or event is not in a reviewable status.',
    }),
    ApiResponse({
      status: 500,
      description: 'Internal Server Error.',
    }),
  );
}
