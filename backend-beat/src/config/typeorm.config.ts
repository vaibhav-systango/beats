import { DataSource, DataSourceOptions } from 'typeorm';
import dotenv from 'dotenv';
import { User } from '../database/entities/user.entity';
import { Role } from '../database/entities/role.entity';
import { Otp } from '../database/entities/otp.entity';
import { EventCategory } from '../database/entities/event-category.entities';
import { Event } from '../database/entities/event.entity';
import { EventSession } from '../database/entities/event-session.entity';
import { SessionCategory } from '../database/entities/session-category.entity';
import { SessionTicketType } from '../database/entities/session-ticket-type.entity';
import { Permission } from '../database/entities/permission.entity';
import { RoutePermission } from '../database/entities/route-permission.entity';
import { UserSession } from '../database/entities/user-session.entity';

dotenv.config();
export const typeOrmConfig: DataSourceOptions = {
  type: 'postgres',
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT || 5432),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  entities: [
    User,
    Role,
    Otp,
    EventCategory,
     Event, EventSession, SessionCategory, SessionTicketType,
    Permission,
    RoutePermission,
    UserSession,
  ],
  migrations: [__dirname + '/../database/migrations/*.{ts,js}'],

  synchronize: false,
  logging: true,

  extra: {
    max: 10,
  },
};

export const AppDataSource = new DataSource(typeOrmConfig);
