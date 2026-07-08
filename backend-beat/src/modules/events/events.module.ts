import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { EmailModule } from '../../providers/email/email.module';
import { StorageModule } from '../storage/storage.module';

// Controllers (aligned to root module folder)
import { EventsController } from './events.controller';

// Services
import { EventsService } from './services/events.service';
import { EventsHelper } from './helpers/events.helper';
import { SearchModule } from '../search/search.module';

@Module({
  imports: [
    DatabaseModule, 
    EmailModule,
    StorageModule,
    SearchModule,
  ],
  controllers: [
    EventsController,
  ],
  providers: [
    EventsService,
    EventsHelper,
  ],
  exports: [EventsService],
})
export class EventsModule {}
