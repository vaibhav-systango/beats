import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { SessionCategory } from '../entities/session-category.entity';

@Injectable()
export class SessionCategoryRepository extends Repository<SessionCategory> {
  constructor(dataSource: DataSource) {
    super(SessionCategory, dataSource.createEntityManager());
  }
}
