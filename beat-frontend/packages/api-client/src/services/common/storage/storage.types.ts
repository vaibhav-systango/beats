/** Max allowed by S3/MinIO SigV4 presigned GET (7 days). */
export const STORAGE_SIGNED_URL_MAX_EXPIRES_IN_SECONDS = 604_800 as const

export type SignedUrlRequestBody = {
  key: string
  expiresInSeconds: number
}

export type SignedUrlResponse = {
  url: string
}
