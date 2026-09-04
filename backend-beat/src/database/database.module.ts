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
import { UserSessionRepository } from './repositories/user-session.repository';
import { OtpRepository } from './repositories/otp.repository';
import { EventRepository } from './repositories/event.repository';
import { EventCategoryRepository } from './repositories/event-category.repository';
import { EventSessionRepository } from './repositories/event-session.repository';
import { SessionCategoryRepository } from './repositories/session-category.repository';
import { SessionTicketTypeRepository } from './repositories/session-ticket-type.repository';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { RoutePermission } from './entities/route-permission.entity';
import { Payment } from './entities/payment.entity';
import { IssuedTicket } from './entities/issued-ticket.entity';
import { Wallet } from './entities/wallet.entity';
import { WalletLedgerEntry } from './entities/wallet-ledger-entry.entity';
import { PaymentSplit } from './entities/payment-split.entity';
import { PaymentWebhookEvent } from './entities/payment-webhook-event.entity';
import { RoleRepository } from './repositories/role.repository';
import { RoutePermissionRepository } from './repositories/route-permission.repository';
import { PaymentRepository } from './repositories/payment.repository';

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
      Role,
      Permission,
      RoutePermission,
      Payment,
      IssuedTicket,
      Wallet,
      WalletLedgerEntry,
      PaymentSplit,
      PaymentWebhookEvent,
    ]),
  ],
  providers: [
    UserRepository,
    UserSessionRepository,
    OtpRepository,
    EventRepository,
    EventCategoryRepository,
    EventSessionRepository,
    SessionCategoryRepository,
    SessionTicketTypeRepository,
    RoleRepository,
    RoutePermissionRepository,
    PaymentRepository,
  ],
  exports: [
    UserRepository,
    UserSessionRepository,
    OtpRepository,
    EventRepository,
    EventCategoryRepository,
    EventSessionRepository,
    SessionCategoryRepository,
    SessionTicketTypeRepository,
    RoleRepository,
    RoutePermissionRepository,
    PaymentRepository,
  ],
})
export class DatabaseModule {}
