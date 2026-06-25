import { Module } from '@nestjs/common';
import { EventCategoriesController } from './event-categories.controller';
import { EventCategoryService } from './services/event-category.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [EventCategoriesController],
  providers: [EventCategoryService],
  exports: [EventCategoryService],
})
export class EventCategoriesModule {}
