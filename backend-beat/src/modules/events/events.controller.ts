import {
  Controller,
  Post,
  Put,
  Delete,
  Get,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  ForbiddenException,
  HttpException,
  InternalServerErrorException,
  Logger,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  Request,
  Query,
  Patch,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags } from '@nestjs/swagger';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole } from '../../common/enums/user.enums';
import { UlidValidationPipe } from '../../common/pipes/ulid-validation.pipe';
import { EventsService } from './services/events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { CreateEventSessionDto } from './dto/create-session.dto';
import { EventMessages, EventConstants } from './constants/events.constants';
import { EventsHelper } from './helpers/events.helper';

// Swagger decorators
import { CreateEventSwagger } from './decorators/swagger/create-event.decorator';
import { UpdateEventSwagger } from './decorators/swagger/update-event.decorator';
import { SubmitEventSwagger } from './decorators/swagger/submit-event.decorator';
import { DeleteEventSwagger } from './decorators/swagger/delete-event.decorator';
import { GetOrganizerEventsSwagger } from './decorators/swagger/get-organizer-events.decorator';
import { GetPublicDiscoverySwagger } from './decorators/swagger/get-public-discovery.decorator';
import { GetEventDetailsSwagger } from './decorators/swagger/get-event-details.decorator';
import {
  CreateSessionSwagger,
  UpdateSessionSwagger,
  DeleteSessionSwagger,
  GetEventSessionsSwagger,
} from './decorators/swagger/session.decorators';

@ApiTags('Events')
@Controller('api/v1/events')
export class EventsController {
  private readonly logger = new Logger(EventsController.name);

  constructor(
    private readonly eventsService: EventsService,
    private readonly eventsHelper: EventsHelper,
  ) {}



  // ==========================================
  // EVENT ENDPOINTS
  // ==========================================

  /**
   * Organizer submits a new event shell metadata (SAVE_DRAFT or SUBMIT_FOR_APPROVAL).
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: EventConstants.CREATION_LIMIT, ttl: EventConstants.CREATION_TTL_MS } })
  @CreateEventSwagger()
  async create(
    @Body() dto: CreateEventDto,
    @Request() req: any,
  ) {
    try {
      const user = req.user;
      if (user.role !== UserRole.ORGANIZER) {
        throw new ForbiddenException(EventMessages.ORGANIZER_ONLY_CREATE);
      }
      return await this.eventsService.createEvent(dto, user.sub);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('Error occurred in event creation: ', error);
      throw new InternalServerErrorException({
        message: EventMessages.UNEXPECTED_ERROR,
      });
    }
  }

  /**
   * Organizer updates event shell metadata.
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: EventConstants.CREATION_LIMIT, ttl: EventConstants.CREATION_TTL_MS } })
  @UpdateEventSwagger()
  async update(
    @Param('id', UlidValidationPipe) id: string,
    @Body() dto: UpdateEventDto,
    @Request() req: any,
  ) {
    try {
      const user = req.user;
      if (user.role !== UserRole.ORGANIZER) {
        throw new ForbiddenException(EventMessages.ORGANIZER_ONLY_UPDATE);
      }
      return await this.eventsService.updateEvent(id, dto, user.sub);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('Error occurred in event update: ', error);
      throw new InternalServerErrorException({
        message: EventMessages.UNEXPECTED_ERROR,
      });
    }
  }

  /**
   * Organizer submits event and its database sessions for administrative review.
   */
  @Post(':id/submit')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: EventConstants.CREATION_LIMIT, ttl: EventConstants.CREATION_TTL_MS } })
  @SubmitEventSwagger()
  async submit(
    @Param('id', UlidValidationPipe) id: string,
    @Request() req: any,
  ) {
    try {
      const user = req.user;
      if (user.role !== UserRole.ORGANIZER) {
        throw new ForbiddenException('Only organizer accounts can submit events.');
      }
      return await this.eventsService.submitEvent(id, user.sub);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('Error occurred in event submission: ', error);
      throw new InternalServerErrorException({
        message: EventMessages.UNEXPECTED_ERROR,
      });
    }
  }

  /**
   * Organizer soft deletes their event.
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @DeleteEventSwagger()
  async delete(
    @Param('id', UlidValidationPipe) id: string,
    @Request() req: any,
  ) {
    try {
      const user = req.user;
      if (user.role !== UserRole.ORGANIZER) {
        throw new ForbiddenException(EventMessages.ORGANIZER_ONLY_DELETE);
      }
      return await this.eventsService.softDeleteEvent(id, user.sub);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('Error occurred in event delete: ', error);
      throw new InternalServerErrorException({
        message: EventMessages.UNEXPECTED_ERROR,
      });
    }
  }

  /**
   * Organizer retrieves list of created events.
   */
  @Get('my-events')
  @UseGuards(JwtAuthGuard)
  @GetOrganizerEventsSwagger()
  async getOrganizerEvents(
    @Request() req: any,
  ) {
    try {
      const user = req.user;
      if (user.role !== UserRole.ORGANIZER) {
        throw new ForbiddenException(EventMessages.ORGANIZER_ONLY_VIEW);
      }
      return await this.eventsService.getOrganizerEvents(user.sub);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('Error occurred in fetching organizer events: ', error);
      throw new InternalServerErrorException({
        message: EventMessages.UNEXPECTED_ERROR,
      });
    }
  }

  // ==========================================
  // SESSION SUB-ROUTING ENDPOINTS
  // ==========================================

  /**
   * Adds a new session to an event.
   */
  @Post(':eventId/sessions')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(AnyFilesInterceptor({ storage: memoryStorage() }))
  @HttpCode(HttpStatus.CREATED)
  @CreateSessionSwagger()
  async createSession(
    @Param('eventId', UlidValidationPipe) eventId: string,
    @Body() rawDto: any,
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req: any,
  ) {
    try {
      const user = req.user;
      if (user.role !== UserRole.ORGANIZER) {
        throw new ForbiddenException('Only organizer accounts can add sessions.');
      }
      const dto = this.eventsHelper.parseMultipartSessionDto(rawDto);
      await this.eventsHelper.processUploadedFilesSingle(dto, files);

      return await this.eventsService.createSession(eventId, dto, user.sub);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`Error occurred in creating event session: ${error.message}`, error.stack);
      throw new InternalServerErrorException({
        message: EventMessages.UNEXPECTED_ERROR,
      });
    }
  }

  /**
   * Updates an existing session.
   */
  @Patch(':eventId/sessions/:sessionId')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(AnyFilesInterceptor({ storage: memoryStorage() }))
  @UpdateSessionSwagger()
  async updateSession(
    @Param('eventId', UlidValidationPipe) eventId: string,
    @Param('sessionId', UlidValidationPipe) sessionId: string,
    @Body() rawDto: any,
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req: any,
  ) {
    try {
      const user = req.user;
      if (user.role !== UserRole.ORGANIZER) {
        throw new ForbiddenException('Only organizer accounts can update sessions.');
      }
      console.log('rawDto received in updateSession:', JSON.stringify(rawDto, null, 2));
      const dto = this.eventsHelper.parseMultipartSessionDto(rawDto);
      console.log('dto parsed in updateSession:', JSON.stringify(dto, null, 2));
      await this.eventsHelper.processUploadedFilesSingle(dto, files);

      return await this.eventsService.updateSession(eventId, sessionId, dto, user.sub);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`Error occurred in updating event session: ${error.message}`, error.stack);
      throw new InternalServerErrorException({
        message: EventMessages.UNEXPECTED_ERROR,
      });
    }
  }

  /**
   * Soft deletes a session.
   */
  @Delete(':eventId/sessions/:sessionId')
  @UseGuards(JwtAuthGuard)
  @DeleteSessionSwagger()
  async deleteSession(
    @Param('eventId', UlidValidationPipe) eventId: string,
    @Param('sessionId', UlidValidationPipe) sessionId: string,
    @Request() req: any,
  ) {
    try {
      const user = req.user;
      if (user.role !== UserRole.ORGANIZER) {
        throw new ForbiddenException('Only organizer accounts can delete sessions.');
      }
      return await this.eventsService.deleteSession(eventId, sessionId, user.sub);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('Error occurred in deleting event session: ', error);
      throw new InternalServerErrorException({
        message: EventMessages.UNEXPECTED_ERROR,
      });
    }
  }

  /**
   * Lists all sessions of an event.
   */
  @Get(':eventId/sessions')
  @GetEventSessionsSwagger()
  async getSessions(
    @Param('eventId', UlidValidationPipe) eventId: string,
  ) {
    try {
      return await this.eventsService.getEventSessions(eventId);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('Error occurred in listing event sessions: ', error);
      throw new InternalServerErrorException({
        message: EventMessages.UNEXPECTED_ERROR,
      });
    }
  }

  // ==========================================
  // PUBLIC SEARCH & DISCOVERY ENDPOINTS
  // ==========================================

  /**
   * Public Search & Discovery endpoint.
   */
  @Get()
  @Throttle({ default: { limit: EventConstants.DISCOVERY_LIMIT, ttl: EventConstants.DISCOVERY_TTL_MS } })
  @GetPublicDiscoverySwagger()
  async getPublicDiscovery(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    try {
      const limitVal = limit ? parseInt(limit, 10) : 10;
      const offsetVal = offset ? parseInt(offset, 10) : 0;
      return await this.eventsService.getPublicDiscoveryEvents(limitVal, offsetVal);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('Error occurred in public discovery: ', error);
      throw new InternalServerErrorException({
        message: EventMessages.UNEXPECTED_ERROR,
      });
    }
  }

  /**
   * Retrieves full event details by ID.
   */
  @Get(':id')
  @GetEventDetailsSwagger()
  async getDetails(@Param('id', UlidValidationPipe) id: string) {
    try {
      return await this.eventsService.getEventDetails(id);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('Error occurred in fetching event details: ', error);
      throw new InternalServerErrorException({
        message: EventMessages.UNEXPECTED_ERROR,
      });
    }
  }
}
