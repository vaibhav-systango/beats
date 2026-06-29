import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { EventSession } from '../entities/event-session.entity';

@Injectable()
export class EventSessionRepository extends Repository<EventSession> {
  constructor(dataSource: DataSource) {
    super(EventSession, dataSource.createEntityManager());
  }
}
