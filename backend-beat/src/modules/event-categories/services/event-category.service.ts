import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventCategoryRepository } from '../../../database/repositories/event-category.repository';
import { EventRepository } from '../../../database/repositories/event.repository';
import { EventCategoryMessages } from '../constants/event-category.constants';
import { CreateEventCategoryDto } from '../dto/create-event-category.dto';
import { UpdateEventCategoryDto } from '../dto/update-event-category.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

@Injectable()
export class EventCategoryService {
  constructor(
    private readonly eventCategoryRepository: EventCategoryRepository,
    private readonly eventRepository: EventRepository,
  ) {}

  async createEventCategory(dto: CreateEventCategoryDto) {
    await this.assertNameIsUnique(dto.name);

    const category = this.eventCategoryRepository.create({
      name: dto.name,
      description: dto.description?.trim() || undefined,
    });

    return this.eventCategoryRepository.save(category);
  }

  async getEventCategories(query: PaginationQueryDto) {
    const [data, total] = await this.eventCategoryRepository.findAllOrdered(query.limit, query.offset);
    return { data, total, limit: query.limit, offset: query.offset };
  }

  async getEventCategory(id: string) {
    return this.findCategoryOrThrow(id);
  }

  async updateEventCategory(id: string, dto: UpdateEventCategoryDto) {
    if (dto.name === undefined && dto.description === undefined) {
      throw new BadRequestException({ message: EventCategoryMessages.EMPTY_UPDATE });
    }

    const category = await this.findCategoryOrThrow(id);

    if (dto.name !== undefined) {
      await this.assertNameIsUnique(dto.name, id);
      category.name = dto.name;
    }

    if (dto.description !== undefined) {
      category.description = dto.description?.trim() || undefined;
    }

    return this.eventCategoryRepository.save(category);
  }

  async deleteEventCategory(id: string) {
    const category = await this.findCategoryOrThrow(id);

    const eventCount = await this.eventRepository.countByCategoryId(id);
    if (eventCount > 0) {
      throw new ConflictException({ message: EventCategoryMessages.CATEGORY_IN_USE });
    }

    await this.eventCategoryRepository.remove(category);
    return { message: EventCategoryMessages.DELETED };
  }

  private async findCategoryOrThrow(id: string) {
    const category = await this.eventCategoryRepository.findById(id);
    if (!category) {
      throw new NotFoundException({ message: EventCategoryMessages.NOT_FOUND });
    }
    return category;
  }

  private async assertNameIsUnique(name: string, excludeId?: string): Promise<void> {
    if (await this.eventCategoryRepository.existsByName(name, excludeId)) {
      throw new ConflictException({ message: EventCategoryMessages.NAME_ALREADY_EXISTS });
    }
  }
}
