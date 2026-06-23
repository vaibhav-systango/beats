import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit() {
    if (this.dataSource.isInitialized) {
      this.logger.log('Database connected successfully!');
    } else {
      try {
        await this.dataSource.initialize();
        this.logger.log('Database initialized and connected!');
      } catch (err) {
        this.logger.error('Database connection failed:', err);
      }
    }
  }
}