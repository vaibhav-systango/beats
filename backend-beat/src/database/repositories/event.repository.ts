import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Event } from '../entities/event.entity';

@Injectable()
export class EventRepository extends Repository<Event> {
  constructor(dataSource: DataSource) {
    super(Event, dataSource.createEntityManager());
  }

  async existsBySlug(slug: string): Promise<boolean> {
    const count = await this.count({ where: { slug } });
    return count > 0;
  }

  async existsByTitleAndOrganizer(
    title: string,
    organizerId: string,
  ): Promise<boolean> {
    const count = await this.count({ where: { title, organizerId } });
    return count > 0;
  }

  async countByCategoryId(categoryId: string): Promise<number> {
    return this.createQueryBuilder('event')
      .innerJoin('event_sessions', 'session', 'session.event_id = event.id')
      .innerJoin('session_categories', 'sc', 'sc.session_id = session.id')
      .where('sc.category_id = :categoryId', { categoryId })
      .andWhere('event.deleted_at IS NULL')
      .andWhere('session.deleted_at IS NULL')
      .getCount();
  }
}