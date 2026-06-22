import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Otp } from '../entities/otp.entity';

@Injectable()
export class OtpRepository extends Repository<Otp> {
  constructor(dataSource: DataSource) {
    super(Otp, dataSource.createEntityManager());
  }
}
