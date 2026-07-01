import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  ForbiddenException,
  HttpException,
  InternalServerErrorException,
  Logger,
  Request,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole } from '../../common/enums/user.enums';
import { UlidValidationPipe } from '../../common/pipes/ulid-validation.pipe';
import { AdminEventsService } from './services/admin-events.service';
import { ReviewEventDto } from './dto/review-event.dto';
import { EventMessages } from './constants/events.constants';

// Swagger decorators
import { ReviewEventSwagger } from './decorators/swagger/review-event.decorator';
import { CancelEventSwagger } from './decorators/swagger/cancel-event.decorator';

@ApiTags('Admin Events')
@Controller('api/v1/admin/events')
@UseGuards(JwtAuthGuard)
export class AdminEventsController {
  private readonly logger = new Logger(AdminEventsController.name);

  constructor(private readonly adminEventsService: AdminEventsService) {}

  /**
   * Admin reviews an event creation or revision.
   */
  @Post(':id/review')
  @HttpCode(HttpStatus.OK)
  @ReviewEventSwagger()
  async review(
    @Param('id', UlidValidationPipe) id: string,
    @Body() dto: ReviewEventDto,
    @Request() req: any,
  ) {
    try {
      const user = req.user;
      if (user.role !== UserRole.ADMIN) {
        throw new ForbiddenException(EventMessages.ADMIN_ONLY_REVIEW);
      }
      dto.adminId = user.sub;
      return await this.adminEventsService.reviewEvent(id, dto);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('Error occurred in admin review: ', error);
      throw new InternalServerErrorException({
        message: EventMessages.UNEXPECTED_ERROR,
      });
    }
  }

  /**
   * Emergency Cancellation of a live show.
   * Instantly stops booking actions for all tickets.
   */
  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @CancelEventSwagger()
  async cancel(
    @Param('id', UlidValidationPipe) id: string,
    @Body('reason') reason: string,
    @Request() req: any,
  ) {
    try {
      const user = req.user;
      if (user.role !== UserRole.ADMIN) {
        throw new ForbiddenException(EventMessages.ADMIN_ONLY_CANCEL);
      }
      return await this.adminEventsService.cancelEvent(id, user.sub, reason);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('Error occurred in admin cancel: ', error);
      throw new InternalServerErrorException({
        message: EventMessages.UNEXPECTED_ERROR,
      });
    }
  }
}
