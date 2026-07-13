import {
  Body,
  Controller,
  HttpCode,
  HttpException,
  InternalServerErrorException,
  Logger,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';
import { UserRole } from '../../common/enums/user.enums';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StorageMessages } from './constants/storage.constants';
import { GenerateSignedUrlDto } from './dto/generate-signed-url.dto';
import { GenerateSignedUrlSwagger } from './decorators/swagger/generate-signed-url.decorator';
import { FileAccessService } from './services/file-access.service';

interface AuthenticatedRequest extends ExpressRequest {
  user: {
    sub: string;
    role: UserRole;
  };
}

@ApiTags('Storage')
@Controller('api/v1/storage')
export class StorageController {
  private readonly logger = new Logger(StorageController.name);

  constructor(private readonly fileAccessService: FileAccessService) {}

  @Post('signed-url')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @GenerateSignedUrlSwagger()
  async generateSignedUrl(
    @Request() req: AuthenticatedRequest,
    @Body() dto: GenerateSignedUrlDto,
  ) {
    try {
      return await this.fileAccessService.generateSignedUrl(
        req.user.sub,
        req.user.role,
        dto.key,
        dto.expiresInSeconds,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error('Failed to generate signed URL', error);
      throw new InternalServerErrorException({
        message: StorageMessages.UNEXPECTED_ERROR,
      });
    }
  }
}
