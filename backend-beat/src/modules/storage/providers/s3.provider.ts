import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { ulid } from 'ulid';
import { extname } from 'path';
import * as mime from 'mime-types';
import { IStorageProvider } from './storage.interface';

@Injectable()
export class S3Provider implements IStorageProvider {
  private readonly logger = new Logger(S3Provider.name);
  private readonly client: S3Client;
  private readonly bucketName: string;
  private readonly bucketBaseUrl: string;

  constructor(private readonly configService: ConfigService) {
    const region = this.configService.get<string>('s3.region', 'us-east-1');
    this.bucketName =
      this.configService.get<string>('s3.bucketName') || 'beats-events';

    const publicUrlBase = this.configService.get<string>('s3.publicUrlBase');
    this.bucketBaseUrl =
      publicUrlBase?.replace(/\/$/, '') ||
      `https://${this.bucketName}.s3.${region}.amazonaws.com`;

    const accessKeyId = this.configService.get<string>('s3.accessKeyId');
    const secretAccessKey = this.configService.get<string>('s3.secretAccessKey');

    const credentials = accessKeyId
      ? { accessKeyId, secretAccessKey: secretAccessKey || '' }
      : undefined;

    this.client = new S3Client({
      region,
      ...(credentials ? { credentials } : {}),
    });
  }

  async checkHealth(): Promise<boolean> {
    try {
      await this.client.send(
        new HeadBucketCommand({
          Bucket: this.bucketName,
        }),
      );
      this.logger.log(`S3 configured and accessible for bucket "${this.bucketName}".`);
      return true;
    } catch (error: any) {
      this.logger.error(
        `S3 health check failed for bucket "${this.bucketName}": ${error.message}`,
      );
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

      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: filePath,
          Body: file,
          ContentType: contentType,
        }),
      );

      const publicUrl = `${this.bucketBaseUrl}/${filePath}`;
      this.logger.log(`File uploaded to S3: ${publicUrl}`);
      return publicUrl;
    } catch (error) {
      this.logger.error(`S3 upload failed: ${JSON.stringify(error)}`);
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

    const uploadedUrls = results
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
        `Partial upload failure. Rolling back ${uploadedUrls.length} files.`,
      );
      await Promise.allSettled(uploadedUrls.map((url) => this.deleteFile(url)));
      throw failed.reason;
    }

    return uploadedUrls;
  }

  async deleteFile(fileUrl: string): Promise<void> {
    try {
      const key = this.extractKeyFromUrl(fileUrl);
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        }),
      );
      this.logger.log(`Deleted file from S3: ${fileUrl}`);
    } catch (error) {
      this.logger.error(`S3 delete failed: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  getStorageInfo(): { type: string; bucket: string; baseUrl: string } {
    return {
      type: 'S3',
      bucket: this.bucketName,
      baseUrl: this.bucketBaseUrl,
    };
  }

  private extractKeyFromUrl(fileUrl: string): string {
    const baseUrl = new URL(`${this.bucketBaseUrl}/`);
    const url = new URL(fileUrl);

    if (
      url.origin !== baseUrl.origin ||
      !url.pathname.startsWith(baseUrl.pathname)
    ) {
      throw new Error('File URL does not belong to the configured S3 bucket');
    }

    return url.pathname.slice(baseUrl.pathname.length);
  }
}
