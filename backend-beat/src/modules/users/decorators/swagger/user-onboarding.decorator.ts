import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { UsersConstants } from '../../constants/users.constants';
import { UserOnboardingDto } from '../../dto/user-onboarding.dto';

export function UserOnboardingSwagger() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Update user profile for onboarding' }),
    ApiBody({ type: UserOnboardingDto }),
    ApiResponse({
      status: HttpStatus.OK,
      description: UsersConstants.ONBOARDING_SUCCESS,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: UsersConstants.INVALID_CATEGORIES,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: UsersConstants.USER_NOT_FOUND,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'An unexpected error occurred.',
    }),
  );
}
