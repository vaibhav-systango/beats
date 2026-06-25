import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { MulterError } from 'multer';
import { Response } from 'express';

@Catch(MulterError)
export class MulterExceptionFilter implements ExceptionFilter {
  catch(exception: MulterError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    const messageMap: Record<string, string> = {
      LIMIT_FILE_SIZE: 'File size exceeds the maximum allowed limit.',
      LIMIT_FILE_COUNT: 'Too many files uploaded.',
      LIMIT_UNEXPECTED_FILE: `Unexpected file field: ${exception.field ?? 'unknown'}.`,
    };

    const message = messageMap[exception.code] ?? 'File upload error.';

    response.status(HttpStatus.BAD_REQUEST).json({ message });
  }
}
