import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Otp } from './entities/otp.entity';
import { Event } from './entities/event.entity';
import { EventCategory } from './entities/event-category.entities';
import { UserRepository } from './repositories/user.repository';
import { UserSessionRepository } from './repositories/user-session.repository';
import { OtpRepository } from './repositories/otp.repository';
import { EventRepository } from './repositories/event.repository';
import { EventCategoryRepository } from './repositories/event-category.repository';

@Module({
  imports: [TypeOrmModule.forFeature([User, Otp, Event, EventCategory])],
  providers: [
    UserRepository,
    UserSessionRepository,
    OtpRepository,
    EventRepository,
    EventCategoryRepository,
  ],
  exports: [
    UserRepository,
    UserSessionRepository,
    OtpRepository,
    EventRepository,
    EventCategoryRepository,
  ],
})
export class DatabaseModule {}
