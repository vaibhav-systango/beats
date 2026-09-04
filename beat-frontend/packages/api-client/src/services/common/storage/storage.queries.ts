import { useQuery, type UseQueryResult } from '@tanstack/react-query'

import { QUERY_KEYS } from '../../queryKeys'

import { fetchSignedUrl } from './storage.api'
import {
  STORAGE_SIGNED_URL_MAX_EXPIRES_IN_SECONDS,
  type SignedUrlResponse,
} from './storage.types'
import { isDirectMediaUrl, needsSignedMediaUrl } from './storage.utils'

/** Refresh signed URLs 5 minutes before they expire. */
const SIGNED_URL_STALE_MS =
  (STORAGE_SIGNED_URL_MAX_EXPIRES_IN_SECONDS - 5 * 60) * 1000

export type UseSignedMediaUrlResult = {
  url: string | null
  isLoading: boolean
  isError: boolean
  error: Error | null
}

/**
 * Resolves a storage key to a usable img src. Passes through http(s)/blob/data URLs.
 */
export function useSignedMediaUrl(
  keyOrUrl: string | null | undefined
): UseSignedMediaUrlResult {
  const shouldSign = needsSignedMediaUrl(keyOrUrl)

  const query: UseQueryResult<SignedUrlResponse, Error> = useQuery({
    queryKey: QUERY_KEYS.COMMON.STORAGE.signedUrl(keyOrUrl ?? ''),
    queryFn: () => fetchSignedUrl(keyOrUrl!),
    enabled: shouldSign,
    staleTime: SIGNED_URL_STALE_MS,
    gcTime: STORAGE_SIGNED_URL_MAX_EXPIRES_IN_SECONDS * 1000,
  })

  if (!keyOrUrl) {
    return { url: null, isLoading: false, isError: false, error: null }
  }

  if (isDirectMediaUrl(keyOrUrl)) {
    return { url: keyOrUrl, isLoading: false, isError: false, error: null }
  }

  return {
    url: query.data?.url ?? null,
    isLoading: query.isLoading || query.isFetching,
    isError: query.isError,
    error: query.error,
  }
}
