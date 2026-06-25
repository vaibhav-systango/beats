import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { STORAGE_PROVIDER } from '../providers/storage.interface';
import type { IStorageProvider } from '../providers/storage.interface';

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);

  constructor(
    @Inject(STORAGE_PROVIDER)
    private readonly storageProvider: IStorageProvider,
  ) {}

  async onModuleInit(): Promise<void> {
    const healthy = await this.storageProvider.checkHealth();
    const info = this.storageProvider.getStorageInfo();
    if (healthy) {
      this.logger.log(
        `Storage ready — provider: ${info.type}, bucket: ${info.bucket}`,
      );
    } else {
      this.logger.warn(
        `Storage health check failed — provider: ${info.type}, bucket: ${info.bucket}`,
      );
    }
  }

  async uploadFile(
    file: Buffer,
    originalName: string,
    prefix?: string,
  ): Promise<string> {
    this.logger.log(
      `Uploading ${originalName} via ${this.storageProvider.constructor.name}`,
    );
    return this.storageProvider.uploadFile(file, originalName, prefix);
  }

  async uploadMultipleFiles(
    files: Array<{ buffer: Buffer; originalName: string; prefix?: string }>,
  ): Promise<string[]> {
    this.logger.log(
      `Uploading ${files.length} files via ${this.storageProvider.constructor.name}`,
    );
    return this.storageProvider.uploadMultipleFiles(files);
  }

  async deleteFile(fileUrl: string): Promise<void> {
    this.logger.log(
      `Deleting ${fileUrl} via ${this.storageProvider.constructor.name}`,
    );
    return this.storageProvider.deleteFile(fileUrl);
  }

  getStorageInfo() {
    return this.storageProvider.getStorageInfo();
  }

  buildEventPrefix(eventId: string, field: string): string {
    const sanitize = (v: string) => v.replace(/[^a-zA-Z0-9_-]/g, '');
    return `events/${sanitize(eventId)}/${sanitize(field)}`;
  }
}
