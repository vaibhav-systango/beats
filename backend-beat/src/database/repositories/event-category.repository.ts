import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { EventCategory } from '../entities/event-category.entities';

@Injectable()
export class EventCategoryRepository extends Repository<EventCategory> {
  constructor(dataSource: DataSource) {
    super(EventCategory, dataSource.createEntityManager());
  }

  async findById(id: string): Promise<EventCategory | null> {
    return this.findOne({ where: { id, isDeleted: false } });
  }

  async existsByName(name: string, excludeId?: string): Promise<boolean> {
    const normalized = name.trim().toLowerCase();
    const qb = this.createQueryBuilder('category')
      .where('LOWER(category.name) = :name', { name: normalized })
      .andWhere('category.is_deleted = false');

    if (excludeId) {
      qb.andWhere('category.id != :excludeId', { excludeId });
    }

    return (await qb.getCount()) > 0;
  }

  async findDeletedByName(name: string): Promise<EventCategory | null> {
    const normalized = name.trim().toLowerCase();
    return this.createQueryBuilder('category')
      .where('LOWER(category.name) = :name', { name: normalized })
      .andWhere('category.is_deleted = true')
      .getOne();
  }

  async findAllOrdered(limit: number, offset: number): Promise<[EventCategory[], number]> {
    return this.findAndCount({
      where: { isDeleted: false },
      order: { name: 'ASC' },
      take: limit,
      skip: offset,
    });
  }
}
