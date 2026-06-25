import { registerAs } from '@nestjs/config';
export const storageConfiguration = registerAs('storage', () => ({
  provider: (process.env.STORAGE_PROVIDER || 'minio').toLowerCase(),
  bucketName: process.env.STORAGE_BUCKET || 'beats-events',
  maxFileSizeMb: Number(process.env.STORAGE_MAX_FILE_SIZE_MB || 20),
}));

export const minioConfiguration = registerAs('minio', () => ({
  endpoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: process.env.MINIO_PORT || '9000',
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
  bucketName: process.env.STORAGE_BUCKET || 'beats-events',
  publicUrlBase: process.env.MINIO_PUBLIC_URL_BASE,
}));

export const s3Configuration = registerAs('s3', () => ({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  bucketName: process.env.STORAGE_BUCKET || 'beats-events',
  publicUrlBase: process.env.S3_PUBLIC_URL_BASE || '',
}));
