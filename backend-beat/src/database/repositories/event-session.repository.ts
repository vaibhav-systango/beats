import { Injectable } from '@nestjs/common';
import { DataSource, Repository, IsNull } from 'typeorm';
import { EventSession, SessionStatus } from '../entities/event-session.entity';

@Injectable()
export class EventSessionRepository extends Repository<EventSession> {
  constructor(dataSource: DataSource) {
    super(EventSession, dataSource.createEntityManager());
  }

  async findSessionsByEventId(eventId: string): Promise<EventSession[]> {
    return this.find({
      where: { eventId, deletedAt: IsNull() },
      order: { priorityWeight: 'DESC', startAt: 'ASC' },
    });
  }

  async findActiveSessionsByEventId(eventId: string): Promise<EventSession[]> {
    return this.find({
      where: { eventId, status: SessionStatus.ACTIVE, deletedAt: IsNull() },
      order: { priorityWeight: 'DESC', startAt: 'ASC' },
    });
  }
}
