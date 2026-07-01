import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { typeOrmConfig } from './config/typeorm.config';
import { AuthModule } from './modules/auth/auth.module';
import { EventCategoriesModule } from './modules/event-categories/event-categories.module';
import { EmailModule } from './providers/email/email.module';
import { EventsModule } from './modules/events/events.module';
import { CacheModule } from './providers/cache/cache.module';
import { StorageModule } from './modules/storage/storage.module';
import { LoggerModule, Params } from 'nestjs-pino';
import { ulid } from 'ulid';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import {
  minioConfiguration,
  s3Configuration,
  storageConfiguration,
} from './config/storage.configuration';
import { loggerConfiguration } from './config/logger.configuration';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        storageConfiguration,
        minioConfiguration,
        s3Configuration,
        loggerConfiguration,
      ],
    }),
    TypeOrmModule.forRoot(typeOrmConfig),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        config.getOrThrow<Params>('logger'),
    }),
    ThrottlerModule.forRoot({ throttlers: [{ ttl: 60000, limit: 500 }] }),
    AuthModule,
    EventCategoriesModule,
    UsersModule,
    EmailModule,
    EventsModule,
    CacheModule,
    StorageModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
