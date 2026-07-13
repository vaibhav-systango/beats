import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { StorageMessages } from '../../constants/storage.constants';
import { GenerateSignedUrlDto } from '../../dto/generate-signed-url.dto';
import { SignedUrlResponseDto } from '../../dto/signed-url-response.dto';

export function GenerateSignedUrlSwagger() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Generate a temporary signed URL for a private storage object',
    }),
    ApiBody({ type: GenerateSignedUrlDto }),
    ApiResponse({
      status: HttpStatus.OK,
      description: StorageMessages.SIGNED_URL_GENERATED,
      type: SignedUrlResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: StorageMessages.INVALID_OBJECT_KEY,
    }),
    ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: StorageMessages.UNAUTHORIZED_FILE_ACCESS,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Authentication required.',
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: StorageMessages.UNEXPECTED_ERROR,
    }),
  );
}
