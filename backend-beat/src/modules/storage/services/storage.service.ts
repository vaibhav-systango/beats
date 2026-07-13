import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { toStorageObjectKey } from '../helpers/storage-key.helper';
import { STORAGE_PROVIDER } from '../providers/storage.interface';
import type {
  IStorageProvider,
  StorageObjectKey,
} from '../providers/storage.interface';

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

  /**
   * Uploads a file and returns the provider-independent object key.
   */
  async uploadFile(
    file: Buffer,
    originalName: string,
    prefix?: string,
  ): Promise<StorageObjectKey> {
    this.logger.log(
      `Uploading ${originalName} via ${this.storageProvider.constructor.name}`,
    );
    return this.storageProvider.uploadFile(file, originalName, prefix);
  }

  async uploadMultipleFiles(
    files: Array<{ buffer: Buffer; originalName: string; prefix?: string }>,
  ): Promise<StorageObjectKey[]> {
    this.logger.log(
      `Uploading ${files.length} files via ${this.storageProvider.constructor.name}`,
    );
    return this.storageProvider.uploadMultipleFiles(files);
  }

  async deleteFile(fileUrlOrKey: string): Promise<void> {
    this.logger.log(
      `Deleting ${fileUrlOrKey} via ${this.storageProvider.constructor.name}`,
    );
    return this.storageProvider.deleteFile(fileUrlOrKey);
  }

  /**
   * Normalizes a stored media reference to a provider-independent object key.
   * Accepts bare keys and legacy S3/MinIO URLs. External URLs (e.g. YouTube) are returned unchanged.
   */
  toObjectKey(reference: string): string {
    const { baseUrl } = this.getStorageInfo();
    return toStorageObjectKey(reference, { publicUrlBase: baseUrl || undefined });
  }

  getStorageInfo() {
    return this.storageProvider.getStorageInfo();
  }

  async generateSignedUrl(
    key: string,
    expiresInSeconds?: number,
  ): Promise<string> {
    this.logger.log(
      `Generating signed URL for key=${key} via ${this.storageProvider.constructor.name}`,
    );
    return this.storageProvider.generateSignedUrl(key, expiresInSeconds);
  }

  buildEventPrefix(eventId: string, field: string): string {
    const sanitize = (v: string) => v.replace(/[^a-zA-Z0-9_-]/g, '');
    return `events/${sanitize(eventId)}/${sanitize(field)}`;
  }
}
