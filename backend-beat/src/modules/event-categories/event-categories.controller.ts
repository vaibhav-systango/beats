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
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

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

@ApiTags('Event Categories')
@Controller('event-categories')
export class EventCategoriesController {
  constructor(private readonly eventCategoryService: EventCategoryService) {}

  @Post()
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

      console.error('Error occurred:', error);
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
      console.error('Error occurred:', error);
      throw new InternalServerErrorException({
        message: EventCategoryMessages.UNEXPECTED_ERROR,
      });
    }
  }

  @Get(':id')
  @GetEventCategorySwagger()
  async findOne(@Param('id') id: string) {
    try {
      return await this.eventCategoryService.getEventCategory(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      console.error('Error occurred:', error);
      throw new InternalServerErrorException({
        message: EventCategoryMessages.UNEXPECTED_ERROR,
      });
    }
  }

  @Patch(':id')
  @UpdateEventCategorySwagger()
  async update(@Param('id') id: string, @Body() dto: UpdateEventCategoryDto) {
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

      console.error('Error occurred:', error);
      throw new InternalServerErrorException({
        message: EventCategoryMessages.UNEXPECTED_ERROR,
      });
    }
  }

  @Delete(':id')
  @DeleteEventCategorySwagger()
  async remove(@Param('id') id: string) {
    try {
      return await this.eventCategoryService.deleteEventCategory(id);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      console.error('Error occurred:', error);
      throw new InternalServerErrorException({
        message: EventCategoryMessages.UNEXPECTED_ERROR,
      });
    }
  }
}
