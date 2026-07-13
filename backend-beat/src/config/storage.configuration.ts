import { registerAs } from '@nestjs/config';
export const storageConfiguration = registerAs('storage', () => {
  const maxFileSize = parseInt(
    process.env.STORAGE_MAX_FILE_SIZE_MB || '20',
    10,
  );
  const signedUrlExpirySeconds = parseInt(
    process.env.STORAGE_SIGNED_URL_EXPIRY_SECONDS ||
      process.env.CLOUDFLARE_SIGNED_URL_EXPIRY_SECONDS ||
      '3600',
    10,
  );

  return {
    provider: (process.env.STORAGE_PROVIDER || 'minio').toLowerCase(),
    bucketName: process.env.STORAGE_BUCKET || 'beats-events',
    maxFileSizeMb: isNaN(maxFileSize) || maxFileSize <= 0 ? 20 : maxFileSize,
    signedUrlExpirySeconds:
      isNaN(signedUrlExpirySeconds) || signedUrlExpirySeconds <= 0
        ? 3600
        : signedUrlExpirySeconds,
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

export const cloudflareConfiguration = registerAs('cloudflare', () => ({
  accessKey: process.env.CLOUDFLARE_ACCESS_KEY || '',
  secretKey: process.env.CLOUDFLARE_SECRET_KEY || '',
  endpoint: process.env.CLOUDFLARE_ENDPOINT || '',
  bucket: process.env.STORAGE_BUCKET || 'beats-events',
  publicUrlBase: process.env.CLOUDFLARE_PUBLIC_URL_BASE || '',
}));
