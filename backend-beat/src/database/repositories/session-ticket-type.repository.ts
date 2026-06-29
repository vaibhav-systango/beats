import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { SessionTicketType } from '../entities/session-ticket-type.entity';

@Injectable()
export class SessionTicketTypeRepository extends Repository<SessionTicketType> {
  constructor(dataSource: DataSource) {
    super(SessionTicketType, dataSource.createEntityManager());
  }
}
