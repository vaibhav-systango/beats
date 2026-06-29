import { registerAs } from '@nestjs/config';
export const storageConfiguration = registerAs('storage', () => {
  const maxFileSize = parseInt(
    process.env.STORAGE_MAX_FILE_SIZE_MB || '20',
    10,
  );
  return {
    provider: (process.env.STORAGE_PROVIDER || 'minio').toLowerCase(),
    bucketName: process.env.STORAGE_BUCKET || 'beats-events',
    maxFileSizeMb: isNaN(maxFileSize) || maxFileSize <= 0 ? 20 : maxFileSize,
  };
});

export const minioConfiguration = registerAs('minio', () => {
  const isDevelopment =
    process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'local';

  return {
    endpoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: process.env.MINIO_PORT || '9000',
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey:
      process.env.MINIO_ACCESS_KEY || (isDevelopment ? 'minioadmin' : ''),
    secretKey:
      process.env.MINIO_SECRET_KEY || (isDevelopment ? 'minioadmin' : ''),
    bucketName: process.env.STORAGE_BUCKET || 'beats-events',
    publicUrlBase: process.env.MINIO_PUBLIC_URL_BASE,
  };
});

export const s3Configuration = registerAs('s3', () => ({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  bucketName: process.env.STORAGE_BUCKET || 'beats-events',
  publicUrlBase: process.env.S3_PUBLIC_URL_BASE || '',
}));
