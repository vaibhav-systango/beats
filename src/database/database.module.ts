import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Otp } from './entities/otp.entity';
import { UserRepository } from './repositories/user.repository';
import { OtpRepository } from './repositories/otp.repository';

@Module({
  imports: [TypeOrmModule.forFeature([User, Otp])],
  providers: [UserRepository, OtpRepository],
  exports: [UserRepository, OtpRepository],
})
export class DatabaseModule {}
