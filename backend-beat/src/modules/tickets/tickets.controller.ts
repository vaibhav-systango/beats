import {
  Controller,
  Get,
  Param,
  HttpException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UlidValidationPipe } from '../../common/pipes/ulid-validation.pipe';
import { TicketsService } from './services/tickets.service';
import { TicketsMessages } from './constants/tickets.constants';
import { GetSessionTicketsSwagger } from './decorators/swagger/get-session-tickets.decorator';

@ApiTags('Tickets')
@Controller('api/v1/event-sessions')
export class TicketsController {
  private readonly logger = new Logger(TicketsController.name);

  constructor(private readonly ticketsService: TicketsService) {}

  @Get(':sessionId/tickets')
  @GetSessionTicketsSwagger()
  async getSessionTickets(
    @Param('sessionId', UlidValidationPipe) sessionId: string,
  ) {
    try {
      return await this.ticketsService.getSessionTickets(sessionId);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('Error fetching session tickets', error);
      throw new InternalServerErrorException({
        message: TicketsMessages.UNEXPECTED_ERROR,
      });
    }
  }
}
