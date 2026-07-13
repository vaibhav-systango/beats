export const StorageMessages = {
  INVALID_OBJECT_KEY: 'Invalid object key.',
  SIGNED_URL_GENERATED: 'Signed URL generated successfully.',
  UNAUTHORIZED_FILE_ACCESS: 'You are not authorized to access this file.',
  UNEXPECTED_ERROR: 'An unexpected error occurred while accessing storage.',
  /**
   * Media `url` fields store provider-independent object keys (e.g. events/cover/...).
   * Legacy rows may still contain full S3/MinIO URLs until rewritten on update.
   */
} as const;
