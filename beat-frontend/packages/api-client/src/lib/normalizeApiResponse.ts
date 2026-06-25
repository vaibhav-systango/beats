/**
 * Normalizes unknown API payloads against a default schema at the API boundary.
 * Use in REST clients or query `queryFn` — not in UI components.
 */

export type NormalizableSchema =
  | string
  | number
  | boolean
  | null
  | NormalizableSchema[]
  | { readonly [key: string]: NormalizableSchema }

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    !(value instanceof Date) &&
    !(value instanceof RegExp)
  )
}

function cloneSchemaValue<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => cloneSchemaValue(item)) as T
  }
  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {}
    for (const key of Object.keys(value)) {
      out[key] = cloneSchemaValue(value[key])
    }
    return out as T
  }
  return value
}

function normalizeValue(response: unknown, schema: unknown): unknown {
  if (Array.isArray(schema)) {
    if (response == null) {
      return cloneSchemaValue(schema)
    }
    if (!Array.isArray(response)) {
      return cloneSchemaValue(schema)
    }
    return response
  }

  if (isPlainObject(schema)) {
    const source = isPlainObject(response) ? response : {}
    const out: Record<string, unknown> = {}

    for (const key of Object.keys(schema)) {
      out[key] = normalizeValue(source[key], schema[key])
    }

    return out
  }

  if (response === null || response === undefined) {
    return schema
  }

  return response
}

export function normalizeApiResponse<const T extends NormalizableSchema>(
  response: unknown,
  schema: T
): T {
  return normalizeValue(response, schema) as T
}

export function createApiResponseNormalizer<const T extends NormalizableSchema>(
  schema: T
) {
  return (response: unknown): T => normalizeApiResponse(response, schema)
}

type PaginatedListResponse = { readonly [key: string]: NormalizableSchema } & {
  data: NormalizableSchema[]
}

export function normalizePaginatedGetResponse<
  const TEntity extends NormalizableSchema,
  const TResponse extends PaginatedListResponse,
>(response: unknown, responseSchema: TResponse, entitySchema: TEntity): TResponse {
  const normalized = normalizeApiResponse(response, responseSchema)
  const rows = normalized.data

  if (!Array.isArray(rows)) {
    return normalized
  }

  return {
    ...normalized,
    data: rows.map((item) => normalizeApiResponse(item, entitySchema)),
  }
}

export function createPaginatedGetResponseNormalizer<
  const TEntity extends NormalizableSchema,
  const TResponse extends PaginatedListResponse,
>(responseSchema: TResponse, entitySchema: TEntity) {
  return (response: unknown): TResponse =>
    normalizePaginatedGetResponse(response, responseSchema, entitySchema)
}
