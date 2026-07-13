import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';
import { ulid } from 'ulid';
import { extname } from 'path';
import * as mime from 'mime-types';
import {
  IStorageProvider,
  StorageObjectReference,
} from './storage.interface';
import { resolveObjectKey } from '../helpers/storage-key.helper';

type UploadBody = Buffer | Readable;

@Injectable()
export class CloudflareProvider implements IStorageProvider {
  private readonly logger = new Logger(CloudflareProvider.name);
  private readonly client: S3Client;
  private readonly bucketName: string;
  private readonly endpoint: string;
  private readonly publicUrlBase: string;
  private readonly signedUrlExpirySeconds: number;

  constructor(private readonly configService: ConfigService) {
    this.bucketName =
      this.configService.get<string>('cloudflare.bucket') || 'beats-events';
    this.endpoint =
      this.configService.get<string>('cloudflare.endpoint', '') || '';
    const accessKey = this.configService.get<string>('cloudflare.accessKey', '');
    const secretKey = this.configService.get<string>('cloudflare.secretKey', '');
    this.publicUrlBase =
      this.configService.get<string>('cloudflare.publicUrlBase') || '';
    this.signedUrlExpirySeconds =
      this.configService.get<number>('storage.signedUrlExpirySeconds') ?? 3600;

    if (!this.endpoint || !accessKey || !secretKey) {
      throw new Error(
        'Cloudflare storage provider requires cloudflare.endpoint, cloudflare.accessKey, and cloudflare.secretKey to be configured.',
      );
    }

    this.client = new S3Client({
      region: 'auto',
      endpoint: this.endpoint,
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
    });
  }

  async checkHealth(): Promise<boolean> {
    try {
      await this.client.send(
        new HeadBucketCommand({
          Bucket: this.bucketName,
        }),
      );
      this.logger.log(
        `Storage initialized — Provider: cloudflare, Bucket: ${this.bucketName}`,
      );
      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Storage health check failed — Provider: cloudflare, Bucket: ${this.bucketName}: ${message}`,
      );
      return false;
    }
  }

  async uploadFile(
    file: Buffer,
    originalName: string,
    prefix = '',
  ): Promise<string> {
    const reference = await this.uploadObject(file, originalName, prefix);
    return reference.key;
  }

  async uploadObject(
    body: UploadBody,
    originalName: string,
    prefix = '',
  ): Promise<StorageObjectReference> {
    try {
      const extension = extname(originalName);
      const fileName = `${ulid()}${extension}`;
      const objectKey = prefix ? `${prefix}/${fileName}` : fileName;
      const contentType =
        mime.lookup(originalName) || 'application/octet-stream';

      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: objectKey,
          Body: body,
          ContentType: contentType,
        }),
      );

      this.logger.log(
        `File uploaded to Cloudflare R2: key=${objectKey}, bucket=${this.bucketName}`,
      );

      return {
        key: objectKey,
        bucket: this.bucketName,
      };
    } catch (error) {
      this.logger.error(
        `Cloudflare R2 upload failed: ${JSON.stringify(error)}`,
      );
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
        publicUrlBase: this.publicUrlBase || undefined,
      });
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        }),
      );
      this.logger.log(`Deleted file from Cloudflare R2: key=${key}`);
    } catch (error) {
      this.logger.error(
        `Cloudflare R2 delete failed: ${JSON.stringify(error)}`,
      );
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

    const expiresIn = expiresInSeconds ?? this.signedUrlExpirySeconds;

    const url = await getSignedUrl(
      this.client,
      new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key.replace(/^\//, ''),
      }),
      { expiresIn },
    );

    this.logger.log(`Generated Cloudflare R2 signed URL for key=${key.replace(/^\//, '')}`);
    return url;
  }

  getStorageInfo(): { type: string; bucket: string; baseUrl: string } {
    const baseUrl =
      this.publicUrlBase.replace(/\/$/, '') ||
      this.endpoint.replace(/\/$/, '');

    return {
      type: 'cloudflare',
      bucket: this.bucketName,
      baseUrl,
    };
  }
}
