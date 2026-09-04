import { API_CONSTANTS } from '../../../constants/api.constants'
import { ERROR_CONSTANTS } from '../../../constants/error.constants'
import { apiClient } from '../../../axios/axios'
import { apiFailureMessage, rethrowWithApiMessage } from '../../../lib/apiErrorMessage'

import {
  STORAGE_SIGNED_URL_MAX_EXPIRES_IN_SECONDS,
  type SignedUrlRequestBody,
  type SignedUrlResponse,
} from './storage.types'
import { extractSignedUrlFromResponse } from './storage.utils'

/**
 * POST /api/v1/storage/signed-url — Resolve a storage key to a temporary download URL.
 */
export async function fetchSignedUrl(
  key: string,
  expiresInSeconds: number = STORAGE_SIGNED_URL_MAX_EXPIRES_IN_SECONDS
): Promise<SignedUrlResponse> {
  const body: SignedUrlRequestBody = { key, expiresInSeconds }

  try {
    const { data } = await apiClient.post<unknown>(API_CONSTANTS.STORAGE_SIGNED_URL, body)
    const url = extractSignedUrlFromResponse(data)

    if (!url) {
      throw new Error(apiFailureMessage(data, ERROR_CONSTANTS.STORAGE_SIGNED_URL))
    }

    return { url }
  } catch (error) {
    rethrowWithApiMessage(error)
  }
}
