import { Injectable } from '@nestjs/common';
import { DataSource, Repository, IsNull } from 'typeorm';
import { Event, EventStatus } from '../entities/event.entity';

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

  async findById(id: string): Promise<Event | null> {
    return this.findOne({ where: { id, deletedAt: IsNull() } });
  }

  async findLivePublishedEvents(limit: number, offset: number): Promise<Event[]> {
    return this.createQueryBuilder('event')
      .where('event.status = :status', { status: EventStatus.PUBLISHED })
      .andWhere('event.deleted_at IS NULL')
      .andWhere((qb) => {
        const subQuery = qb
          .subQuery()
          .select('1')
          .from('event_sessions', 'session')
          .where('session.event_id = event.id')
          .andWhere('session.deleted_at IS NULL')
          .andWhere('session.status = :sessionStatus', { sessionStatus: 'ACTIVE' })
          .getQuery();
        return `EXISTS (${subQuery})`;
      })
      .orderBy(
        `(
          SELECT COALESCE(MAX(session.priority_weight), 0)
          FROM event_sessions session
          WHERE session.event_id = event.id
            AND session.deleted_at IS NULL
            AND session.status = 'ACTIVE'
        )`,
        'DESC',
      )
      .addOrderBy('event.created_at', 'DESC')
      .take(limit)
      .skip(offset)
      .getMany();
  }

  async findOrganizerEvents(organizerId: string): Promise<Event[]> {
    return this.find({
      where: { organizerId, deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });
  }
}