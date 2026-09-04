/**
 * Absolute / local preview URLs can be used as img src directly.
 * Storage keys (e.g. `events/cover/01HXYZ.jpg`) need a signed URL.
 */
export function isDirectMediaUrl(value: string): boolean {
  return /^(https?:|blob:|data:)/i.test(value)
}

export function needsSignedMediaUrl(value: string | null | undefined): value is string {
  return Boolean(value && !isDirectMediaUrl(value))
}

export function extractSignedUrlFromResponse(payload: unknown): string | null {
  if (payload == null) return null
  if (typeof payload === 'string' && payload.length > 0) return payload

  if (typeof payload !== 'object') return null

  const record = payload as Record<string, unknown>

  for (const key of ['url', 'signedUrl', 'signed_url'] as const) {
    const value = record[key]
    if (typeof value === 'string' && value.length > 0) return value
  }

  if ('data' in record) {
    return extractSignedUrlFromResponse(record.data)
  }

  return null
}
