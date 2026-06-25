export interface IStorageProvider {
  uploadFile(
    file: Buffer,
    originalName: string,
    prefix?: string,
  ): Promise<string>;

  uploadMultipleFiles(
    files: Array<{ buffer: Buffer; originalName: string; prefix?: string }>,
  ): Promise<string[]>;

  deleteFile(fileUrl: string): Promise<void>;

  checkHealth(): Promise<boolean>;

  getStorageInfo(): { type: string; bucket: string; baseUrl: string };
}

export const STORAGE_PROVIDER = 'STORAGE_PROVIDER';
