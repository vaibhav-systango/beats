export interface StorageObjectReference {
  key: string;
  bucket: string;
}

/**
 * Provider-independent object key stored in the database.
 * Legacy rows may still hold a full S3/MinIO URL in media `url` fields.
 */
export type StorageObjectKey = string;

export interface SignedUrlResult {
  url: string;
  key: string;
  expiresInSeconds: number;
}

export interface IStorageProvider {
  /** Uploads a file and returns the object key (not a public URL). */
  uploadFile(
    file: Buffer,
    originalName: string,
    prefix?: string,
  ): Promise<StorageObjectKey>;

  uploadMultipleFiles(
    files: Array<{ buffer: Buffer; originalName: string; prefix?: string }>,
  ): Promise<StorageObjectKey[]>;

  deleteFile(fileUrlOrKey: string): Promise<void>;

  checkHealth(): Promise<boolean>;

  getStorageInfo(): { type: string; bucket: string; baseUrl: string };

  generateSignedUrl(key: string, expiresInSeconds?: number): Promise<string>;
}

export const STORAGE_PROVIDER = 'STORAGE_PROVIDER';
