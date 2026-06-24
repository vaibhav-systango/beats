import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { EventCategory } from '../entities/event-category.entities';

@Injectable()
export class EventCategoryRepository extends Repository<EventCategory> {
  constructor(dataSource: DataSource) {
    super(EventCategory, dataSource.createEntityManager());
  }

  async findById(id: string): Promise<EventCategory | null> {
    return this.findOne({ where: { id } });
  }

  async existsByName(name: string, excludeId?: string): Promise<boolean> {
    const normalized = name.trim().toLowerCase();
    const qb = this.createQueryBuilder('category').where(
      'LOWER(category.name) = :name',
      { name: normalized },
    );

    if (excludeId) {
      qb.andWhere('category.id != :excludeId', { excludeId });
    }

    return (await qb.getCount()) > 0;
  }

  async findAllOrdered(limit: number, offset: number): Promise<[EventCategory[], number]> {
    return this.findAndCount({
      order: { name: 'ASC' },
      take: limit,
      skip: offset,
    });
  }
}
