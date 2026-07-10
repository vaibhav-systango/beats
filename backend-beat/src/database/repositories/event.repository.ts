import { Injectable } from '@nestjs/common';
import { DataSource, Repository, IsNull } from 'typeorm';
import { Event, EventStatus, StatusLogEntry } from '../entities/event.entity';

export interface AdminEventListRow {
  id: string;
  title: string;
  status: EventStatus;
  statusLog: StatusLogEntry[];
  updatedAt: number;
  organizerFullName: string | null;
  organizerEmail: string | null;
}

/** @deprecated Use AdminEventListRow */
export type PendingApprovalEventRow = AdminEventListRow;

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

  async countPendingApprovalEvents(): Promise<number> {
    return this.countAdminEventsByStatuses([EventStatus.PENDING_APPROVAL]);
  }

  async findPendingApprovalEvents(page: number, limit: number): Promise<AdminEventListRow[]> {
    return this.findAdminEventsByStatuses([EventStatus.PENDING_APPROVAL], page, limit);
  }

  async countAdminEventsByStatuses(statuses: EventStatus[]): Promise<number> {
    if (statuses.length === 0) {
      return 0;
    }

    return this.createQueryBuilder('event')
      .where('event.status IN (:...statuses)', { statuses })
      .andWhere('event.deleted_at IS NULL')
      .getCount();
  }

  async findAdminEventsByStatuses(
    statuses: EventStatus[],
    page: number,
    limit: number,
  ): Promise<AdminEventListRow[]> {
    if (statuses.length === 0) {
      return [];
    }

    const offset = (page - 1) * limit;

    return this.createQueryBuilder('event')
      .innerJoin('users', 'organizer', 'organizer.id = event.organizer_id')
      .select('event.id', 'id')
      .addSelect('event.title', 'title')
      .addSelect('event.status', 'status')
      .addSelect('event.status_log', 'statusLog')
      .addSelect('event.updated_at', 'updatedAt')
      .addSelect('organizer."fullName"', 'organizerFullName')
      .addSelect('organizer.email', 'organizerEmail')
      .where('event.status IN (:...statuses)', { statuses })
      .andWhere('event.deleted_at IS NULL')
      .orderBy('event.updated_at', 'DESC')
      .offset(offset)
      .limit(limit)
      .getRawMany<AdminEventListRow>();
  }

  async findFirstSessionStartAtByEventIds(
    eventIds: string[],
  ): Promise<Map<string, number | null>> {
    const startAtByEventId = new Map<string, number | null>(
      eventIds.map((id) => [id, null]),
    );

    if (eventIds.length === 0) {
      return startAtByEventId;
    }

    const rows: { event_id: string; start_at: string }[] = await this.manager.query(
      `
        SELECT DISTINCT ON (event_id) event_id, start_at
        FROM event_sessions
        WHERE deleted_at IS NULL
          AND event_id = ANY($1::char(26)[])
        ORDER BY event_id, priority_weight DESC NULLS LAST, start_at ASC
      `,
      [eventIds],
    );

    for (const row of rows) {
      startAtByEventId.set(row.event_id, Number(row.start_at));
    }

    return startAtByEventId;
  }
}