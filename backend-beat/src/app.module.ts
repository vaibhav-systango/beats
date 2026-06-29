import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { typeOrmConfig } from './config/typeorm.config';
import { AuthModule } from './modules/auth/auth.module';
import { EventCategoriesModule } from './modules/event-categories/event-categories.module';
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
