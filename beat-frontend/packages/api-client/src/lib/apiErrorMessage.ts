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

/** Prefer API `message` on axios failures; otherwise rethrow the original error. */
export function rethrowWithApiMessage(error: unknown): never {
  if (isAxiosLikeWithResponseData(error) && error.response.data != null) {
    const apiMessage = extractApiErrorMessage(error.response.data)
    if (apiMessage) throw new Error(apiMessage)
  }
  throw error
}
