import type { DiscoveryFeedResponse, Event, EventWithSessions } from '@beat/types'

import { API_CONSTANTS } from '../../../constants/api.constants'
import { PAGINATION_CONSTANTS } from '../../../constants/pagination.constants'
import { apiClient } from '../../../axios/axios'
import { rethrowWithApiMessage } from '../../../lib/apiErrorMessage'
import {
  normalizeEventDetails,
  normalizeEventEntity,
} from '../../../lib/normalizeEvent'

import type {
  CreateEventInput,
  CreateEventResponse,
  EventsListResponse,
  GetEventsParams,
} from './events.types'

type DiscoveryPagination = {
  total?: number
  limit?: number
  offset?: number
}

type DiscoveryListPayload = {
  data?: unknown
  pagination?: DiscoveryPagination
  total?: number
  page?: number
  limit?: number
  hasNextPage?: boolean
}

function resolveListRows(payload: DiscoveryListPayload): unknown[] {
  if (Array.isArray(payload.data)) {
    return payload.data
  }
  return []
}

function resolveListMeta(
  payload: DiscoveryListPayload,
  page: number,
  limit: number,
  offset: number,
  rowCount: number
): Pick<EventsListResponse, 'total' | 'page' | 'limit' | 'hasNextPage'> {
  const total =
    typeof payload.pagination?.total === 'number'
      ? payload.pagination.total
      : typeof payload.total === 'number'
        ? payload.total
        : rowCount

  const resolvedLimit =
    typeof payload.pagination?.limit === 'number'
      ? payload.pagination.limit
      : typeof payload.limit === 'number'
        ? payload.limit
        : limit

  const hasNextPage =
    typeof payload.hasNextPage === 'boolean'
      ? payload.hasNextPage
      : offset + rowCount < total

  return {
    total,
    page: typeof payload.page === 'number' ? payload.page : page,
    limit: resolvedLimit,
    hasNextPage,
  }
}

/**
 * GET /api/v1/events — Public discovery event list.
 */
export async function fetchEvents(
  params: GetEventsParams = {}
): Promise<EventsListResponse> {
  const limit = params.limit ?? PAGINATION_CONSTANTS.EVENTS_LIST_LIMIT
  const page = params.page ?? PAGINATION_CONSTANTS.DEFAULT_PAGE
  const offset =
    typeof params.offset === 'number' ? params.offset : (page - 1) * limit

  const { data } = await apiClient.get<DiscoveryListPayload>(
    API_CONSTANTS.EVENTS_LIST,
    {
      params: {
        limit,
        offset,
        ...(params.search ? { search: params.search } : {}),
        ...(params.city ? { city: params.city } : {}),
        ...(params.category ? { category: params.category } : {}),
        ...(params.dateFrom != null ? { dateFrom: params.dateFrom } : {}),
        ...(params.dateTo != null ? { dateTo: params.dateTo } : {}),
        ...(params.lat != null ? { lat: params.lat } : {}),
        ...(params.lng != null ? { lng: params.lng } : {}),
        ...(params.radius ? { radius: params.radius } : {}),
        ...(params.minPrice != null ? { minPrice: params.minPrice } : {}),
        ...(params.maxPrice != null ? { maxPrice: params.maxPrice } : {}),
        ...(params.mode ? { mode: params.mode } : {}),
      },
    }
  )

  const payload = (data ?? {}) as DiscoveryListPayload
  const rows = resolveListRows(payload)
  const meta = resolveListMeta(payload, page, limit, offset, rows.length)

  return {
    ...meta,
    data: rows.map((item) => normalizeEventEntity(item)),
  }
}

/**
 * GET /api/v1/events/feed — Time-bucketed discovery sections for home.
 */
export async function fetchEventsFeed(
  params: Pick<
    GetEventsParams,
    'city' | 'category' | 'lat' | 'lng' | 'radius' | 'limit'
  > = {}
): Promise<DiscoveryFeedResponse> {
  const { data } = await apiClient.get<{
    sections?: Array<{ key?: string; label?: string; data?: unknown }>
  }>(API_CONSTANTS.EVENTS_FEED, {
    params: {
      limit: params.limit ?? 8,
      ...(params.city ? { city: params.city } : {}),
      ...(params.category ? { category: params.category } : {}),
      ...(params.lat != null ? { lat: params.lat } : {}),
      ...(params.lng != null ? { lng: params.lng } : {}),
      ...(params.radius ? { radius: params.radius } : {}),
    },
  })

  const sections = Array.isArray(data?.sections) ? data.sections : []
  return {
    sections: sections.map((section) => ({
      key: section.key ?? 'upcoming',
      label: section.label ?? 'Events',
      data: Array.isArray(section.data)
        ? section.data.map((item) => normalizeEventEntity(item))
        : [],
    })),
  }
}

/**
 * GET /api/v1/events/:id — Public event details with sessions.
 * Prefer this over organiser-scoped helpers in the consumer app.
 */
export async function fetchPublicEventById(
  id: string
): Promise<EventWithSessions> {
  try {
    const { data } = await apiClient.get<unknown>(API_CONSTANTS.EVENT_BY_ID(id))
    const payload =
      data && typeof data === 'object' && 'data' in data
        ? (data as { data: unknown }).data
        : data

    return normalizeEventDetails(payload)
  } catch (error) {
    rethrowWithApiMessage(error)
  }
}

/**
 * POST /api/v1/events — Create a new event.
 */
export async function createEvent(input: CreateEventInput): Promise<Event> {
  try {
    const { data } = await apiClient.post<CreateEventResponse | Event>(
      API_CONSTANTS.EVENTS_CREATE,
      {
        title: input.title,
        description: input.description ?? '',
        ...(input.slug ? { slug: input.slug } : {}),
      }
    )

    const payload =
      data && typeof data === 'object' && 'data' in data ? data.data : data

    return normalizeEventEntity(payload)
  } catch (error) {
    rethrowWithApiMessage(error)
  }
}

/** @deprecated Use `fetchEvents` instead. */
export const getEvents = fetchEvents
