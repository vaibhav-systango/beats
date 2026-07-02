import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Otp } from './entities/otp.entity';
import { Event } from './entities/event.entity';
import { EventCategory } from './entities/event-category.entities';
import { EventSession } from './entities/event-session.entity';
import { SessionCategory } from './entities/session-category.entity';
import { SessionTicketType } from './entities/session-ticket-type.entity';
import { UserRepository } from './repositories/user.repository';
import { OtpRepository } from './repositories/otp.repository';
import { EventRepository } from './repositories/event.repository';
import { EventCategoryRepository } from './repositories/event-category.repository';
import { EventSessionRepository } from './repositories/event-session.repository';
import { SessionCategoryRepository } from './repositories/session-category.repository';
import { SessionTicketTypeRepository } from './repositories/session-ticket-type.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Otp,
      Event,
      EventCategory,
      EventSession,
      SessionCategory,
      SessionTicketType,
    ]),
  ],
  providers: [
    UserRepository,
    OtpRepository,
    EventRepository,
    EventCategoryRepository,
    EventSessionRepository,
    SessionCategoryRepository,
    SessionTicketTypeRepository,
  ],
  exports: [
    UserRepository,
    OtpRepository,
    EventRepository,
    EventCategoryRepository,
    EventSessionRepository,
    SessionCategoryRepository,
    SessionTicketTypeRepository,
  ],
})
export class DatabaseModule {}
