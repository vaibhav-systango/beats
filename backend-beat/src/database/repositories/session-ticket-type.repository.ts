import { Injectable } from '@nestjs/common';
import { DataSource, Repository, Not } from 'typeorm';
import { SessionTicketType, TicketTypeStatus } from '../entities/session-ticket-type.entity';

@Injectable()
export class SessionTicketTypeRepository extends Repository<SessionTicketType> {
  constructor(dataSource: DataSource) {
    super(SessionTicketType, dataSource.createEntityManager());
  }

  async findTicketsBySessionId(sessionId: string): Promise<SessionTicketType[]> {
    return this.find({
      where: { sessionId, status: Not(TicketTypeStatus.INACTIVE) },
    });
  }

  async findActiveTicketsBySessionId(sessionId: string): Promise<SessionTicketType[]> {
    return this.find({
      where: { sessionId, status: TicketTypeStatus.ACTIVE },
    });
  }
}
