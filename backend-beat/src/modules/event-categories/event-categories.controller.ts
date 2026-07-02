import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  BadRequestException,
  ConflictException,
  NotFoundException,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { EventCategoryService } from './services/event-category.service';
import { CreateEventCategoryDto } from './dto/create-event-category.dto';
import { UpdateEventCategoryDto } from './dto/update-event-category.dto';
import { EventCategoryMessages } from './constants/event-category.constants';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import {
  CreateEventCategorySwagger,
  GetEventCategoriesSwagger,
  GetEventCategorySwagger,
  UpdateEventCategorySwagger,
  DeleteEventCategorySwagger,
} from './decorators/swagger/event-category.decorator';
import { UlidValidationPipe } from 'src/common/pipes/ulid-validation.pipe';

@ApiTags('Event Categories')
@Controller('api/v1/event-categories')
export class EventCategoriesController {
  private readonly logger = new Logger(EventCategoriesController.name);

  constructor(private readonly eventCategoryService: EventCategoryService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @CreateEventCategorySwagger()
  async create(@Body() dto: CreateEventCategoryDto) {
    try {
      return await this.eventCategoryService.createEventCategory(dto);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

       this.logger.error('Error occurred:', error);
      throw new InternalServerErrorException({
        message: EventCategoryMessages.UNEXPECTED_ERROR,
      });
    }
  }

  @Get()
  @GetEventCategoriesSwagger()
  async findAll(@Query() query: PaginationQueryDto) {
    try {
      return await this.eventCategoryService.getEventCategories(query);
    } catch (error) {
       this.logger.error('Error occurred:', error);
      throw new InternalServerErrorException({
        message: EventCategoryMessages.UNEXPECTED_ERROR,
      });
    }
  }

  @Get(':id')
  @GetEventCategorySwagger()
  async findOne(@Param('id', UlidValidationPipe) id: string) {
    try {
      return await this.eventCategoryService.getEventCategory(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error('Error occurred:', error);
      throw new InternalServerErrorException({
        message: EventCategoryMessages.UNEXPECTED_ERROR,
      });
    }
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @UpdateEventCategorySwagger()
  async update(@Param('id', UlidValidationPipe) id: string, @Body() dto: UpdateEventCategoryDto) {
    try {
      return await this.eventCategoryService.updateEventCategory(id, dto);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      this.logger.error('Error occurred:', error);
      throw new InternalServerErrorException({
        message: EventCategoryMessages.UNEXPECTED_ERROR,
      });
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @DeleteEventCategorySwagger()
  async remove(@Param('id', UlidValidationPipe) id: string) {
    try {
      return await this.eventCategoryService.deleteEventCategory(id);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      this.logger.error('Error occurred:', error);
      throw new InternalServerErrorException({
        message: EventCategoryMessages.UNEXPECTED_ERROR,
      });
    }
  }
}
