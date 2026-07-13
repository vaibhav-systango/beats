import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client as MinioClient } from 'minio';
import { ulid } from 'ulid';
import { extname } from 'path';
import * as mime from 'mime-types';
import { resolveObjectKey } from '../helpers/storage-key.helper';
import { IStorageProvider } from './storage.interface';

@Injectable()
export class MinioProvider implements IStorageProvider {
  private readonly logger = new Logger(MinioProvider.name);
  private readonly minioClient: MinioClient;
  private readonly bucketName: string;
  private readonly bucketBaseUrl: string;
  private readonly signedUrlExpirySeconds: number;

  constructor(private readonly configService: ConfigService) {
    this.bucketName =
      this.configService.get<string>('minio.bucketName') || 'beats-events';
    this.signedUrlExpirySeconds =
      this.configService.get<number>('storage.signedUrlExpirySeconds') ?? 3600;

    const endpoint = this.configService.get<string>(
      'minio.endpoint',
      'localhost',
    );
    const port = parseInt(
      this.configService.get<string>('minio.port', '9000'),
      10,
    );
    const useSSL = this.resolveUseSsl();

    const publicUrlBase = this.configService.get<string>('minio.publicUrlBase');
    let baseUrl = publicUrlBase?.replace(/\/$/, '') || `${useSSL ? 'https' : 'http'}://${endpoint}:${port}`;
    if (!baseUrl.endsWith(`/${this.bucketName}`)) {
      baseUrl = `${baseUrl}/${this.bucketName}`;
    }
    this.bucketBaseUrl = baseUrl;

    this.minioClient = new MinioClient({
      endPoint: endpoint,
      port,
      useSSL,
      accessKey: this.configService.get<string>(
        'minio.accessKey',
        'minioadmin',
      ),
      secretKey: this.configService.get<string>(
        'minio.secretKey',
        'minioadmin',
      ),
    });
  }

  async checkHealth(): Promise<boolean> {
    try {
      const exists = await this.minioClient.bucketExists(this.bucketName);
      if (!exists) {
        this.logger.warn(
          `Bucket "${this.bucketName}" does not exist. Creating it...`,
        );
        await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
        this.logger.log(`Created bucket "${this.bucketName}"`);
      }
      this.logger.log(`MinIO bucket "${this.bucketName}" is accessible.`);
      return true;
    } catch (error) {
      this.logger.error(`MinIO health check failed: ${JSON.stringify(error)}`);
      return false;
    }
  }

  async uploadFile(
    file: Buffer,
    originalName: string,
    prefix = '',
  ): Promise<string> {
    try {
      const extension = extname(originalName);
      const fileName = `${ulid()}${extension}`;
      const filePath = prefix ? `${prefix}/${fileName}` : fileName;
      const contentType =
        mime.lookup(originalName) || 'application/octet-stream';

      await this.minioClient.putObject(
        this.bucketName,
        filePath,
        file,
        file.length,
        { 'Content-Type': contentType },
      );

      this.logger.log(`File uploaded to MinIO: key=${filePath}`);
      return filePath;
    } catch (error) {
      this.logger.error(`MinIO upload failed: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async uploadMultipleFiles(
    files: Array<{ buffer: Buffer; originalName: string; prefix?: string }>,
  ): Promise<string[]> {
    const results = await Promise.allSettled(
      files.map((item) =>
        this.uploadFile(item.buffer, item.originalName, item.prefix),
      ),
    );

    const uploadedKeys = results
      .filter(
        (result): result is PromiseFulfilledResult<string> =>
          result.status === 'fulfilled',
      )
      .map((result) => result.value);

    const failed = results.find(
      (result): result is PromiseRejectedResult => result.status === 'rejected',
    );

    if (failed) {
      this.logger.error(
        `Partial upload failure. Rolling back ${uploadedKeys.length} files.`,
      );
      await Promise.allSettled(
        uploadedKeys.map((key) => this.deleteFile(key)),
      );
      throw failed.reason;
    }

    return uploadedKeys;
  }

  async deleteFile(fileUrlOrKey: string): Promise<void> {
    try {
      const key = resolveObjectKey(fileUrlOrKey, {
        publicUrlBase: this.bucketBaseUrl,
      });
      await this.minioClient.removeObject(this.bucketName, key);
      this.logger.log(`Deleted file from MinIO: key=${key}`);
    } catch (error) {
      this.logger.error(`MinIO delete failed: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async generateSignedUrl(
    key: string,
    expiresInSeconds?: number,
  ): Promise<string> {
    if (!key?.trim()) {
      throw new Error('Object key is required to generate a signed URL');
    }

    const normalizedKey = key.replace(/^\//, '');
    const expiry = expiresInSeconds ?? this.signedUrlExpirySeconds;

    const url = await this.minioClient.presignedGetObject(
      this.bucketName,
      normalizedKey,
      expiry,
    );

    this.logger.log(`Generated MinIO signed URL for key=${normalizedKey}`);
    return url;
  }

  getStorageInfo(): { type: string; bucket: string; baseUrl: string } {
    return {
      type: 'MinIO',
      bucket: this.bucketName,
      baseUrl: this.bucketBaseUrl,
    };
  }

  private resolveUseSsl(): boolean {
    const useSSLValue = this.configService.get<boolean | string>(
      'minio.useSSL',
    );
    if (typeof useSSLValue === 'boolean') {
      return useSSLValue;
    }
    if (typeof useSSLValue === 'string') {
      return useSSLValue.toLowerCase() === 'true';
    }
    return false;
  }
}
