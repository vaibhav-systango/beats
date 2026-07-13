import { Global, Module, Provider } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { DatabaseModule } from '../../database/database.module';

import { CloudflareProvider } from './providers/cloudflare.provider';
import { MinioProvider } from './providers/minio.provider';
import { S3Provider } from './providers/s3.provider';
import {
  IStorageProvider,
  STORAGE_PROVIDER,
} from './providers/storage.interface';
import { StorageService } from './services/storage.service';
import { FileAccessService } from './services/file-access.service';
import { StorageController } from './storage.controller';

const StorageProviderFactory: Provider<IStorageProvider> = {
  provide: STORAGE_PROVIDER,
  inject: [ConfigService],
  useFactory: (configService: ConfigService): IStorageProvider => {
    const provider = (
      configService.get<string>('storage.provider') ?? 'minio'
    ).toLowerCase();

    switch (provider) {
      case 's3':
        return new S3Provider(configService);
      case 'minio':
        return new MinioProvider(configService);
      case 'cloudflare':
        return new CloudflareProvider(configService);
      default:
        throw new Error(
          `Unsupported STORAGE_PROVIDER: ${provider}. Use "minio", "s3", or "cloudflare".`,
        );
    }
  },
};

@Global()
@Module({
  imports: [ConfigModule, DatabaseModule],
  controllers: [StorageController],
  providers: [StorageService, FileAccessService, StorageProviderFactory],
  exports: [StorageService, FileAccessService],
})
export class StorageModule {}
