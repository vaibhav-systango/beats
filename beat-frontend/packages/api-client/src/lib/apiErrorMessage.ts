function firstApiMessageFromField(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed.length ? trimmed : null
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      if (typeof item === 'string') {
        const trimmed = item.trim()
        if (trimmed.length) return trimmed
      }
    }
  }
  return null
}

/** Reads `message` / `messages` (string or string[]) from typical REST error bodies. */
export function extractApiErrorMessage(payload: unknown): string | null {
  if (payload == null || typeof payload !== 'object') return null
  const record = payload as Record<string, unknown>
  return (
    firstApiMessageFromField(record.message) ??
    firstApiMessageFromField(record.messages) ??
    null
  )
}

export function isAxiosLikeWithResponseData(
  error: unknown
): error is { response: { data?: unknown } } {
  if (typeof error !== 'object' || error === null) return false
  if (!('response' in error)) return false
  const response = (error as { response?: unknown }).response
  return typeof response === 'object' && response !== null
}

/** Message from envelope body, or a caller-provided fallback when the API omits details. */
export function apiFailureMessage(payload: unknown, fallback: string): string {
  return extractApiErrorMessage(payload) ?? fallback
}

/** Error that keeps HTTP status after axios normalize / message promotion. */
export class ApiClientError extends Error {
  readonly statusCode?: number

  constructor(message: string, statusCode?: number) {
    super(message)
    this.name = 'ApiClientError'
    this.statusCode = statusCode
  }
}

function readStatusCode(error: unknown): number | undefined {
  if (error instanceof ApiClientError) {
    return error.statusCode
  }

  if (typeof error === 'object' && error !== null && 'statusCode' in error) {
    const statusCode = (error as { statusCode?: unknown }).statusCode
    if (typeof statusCode === 'number') return statusCode
  }

  if (isAxiosLikeWithResponseData(error)) {
    const status = (error.response as { status?: unknown }).status
    if (typeof status === 'number') return status
  }

  return undefined
}

export function getApiErrorStatusCode(error: unknown): number | undefined {
  return readStatusCode(error)
}

export function isNotFoundApiError(error: unknown): boolean {
  return readStatusCode(error) === 404
}

/** Prefer API `message` on axios failures; otherwise rethrow the original error. */
export function rethrowWithApiMessage(error: unknown): never {
  const statusCode = readStatusCode(error)

  if (isAxiosLikeWithResponseData(error) && error.response.data != null) {
    const apiMessage = extractApiErrorMessage(error.response.data)
    if (apiMessage) throw new ApiClientError(apiMessage, statusCode)
  }

  const apiMessage = extractApiErrorMessage(error)
  if (apiMessage) throw new ApiClientError(apiMessage, statusCode)

  throw error
}

/** Reads a user-facing message from API envelopes, axios failures, or promoted Errors. */
export function getApiErrorMessage(error: unknown): string | null {
  if (isAxiosLikeWithResponseData(error)) {
    const fromResponse = extractApiErrorMessage(error.response.data)
    if (fromResponse) return fromResponse
  }

  const fromPayload = extractApiErrorMessage(error)
  if (fromPayload) return fromPayload

  if (error instanceof Error) {
    const trimmed = error.message.trim()
    return trimmed.length ? trimmed : null
  }

  return null
}
