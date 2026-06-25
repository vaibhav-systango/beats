import { Global, Module, Provider } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { MinioProvider } from './providers/minio.provider';
import { S3Provider } from './providers/s3.provider';
import {
  IStorageProvider,
  STORAGE_PROVIDER,
} from './providers/storage.interface';
import { StorageService } from './services/storage.service';

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
      default:
        throw new Error(
          `Unsupported STORAGE_PROVIDER: ${provider}. Use "minio" or "s3".`,
        );
    }
  },
};

@Global()
@Module({
  imports: [ConfigModule],
  providers: [StorageService, StorageProviderFactory],
  exports: [StorageService],
})
export class StorageModule {}
