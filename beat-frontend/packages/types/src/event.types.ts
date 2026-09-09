export type EventStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'PUBLISHED'
  | 'CANCELLED'
  | 'COMPLETED'

export interface Event {
  id: string
  title: string
  slug: string
  description: string
  status: EventStatus
  /** Mapped from backend `organizerId`. */
  organiserId: string
  createdAt?: number
  updatedAt?: number
  /** Derived from the first session when available. */
  startAt?: number
  /** Derived from the first session address when available. */
  city?: string
  /** Derived from the first session venue when available. */
  venue?: string
  /** Cover/poster image URL or storage key from the first session. */
  coverImageUrl?: string
  /** Lowest ticket price across first-session ticket types (rupees). */
  priceFrom?: number
}

export interface GetEventsParams {
  page?: number
  limit?: number
  offset?: number
  /** @deprecated Public discovery always returns live published events. */
  status?: EventStatus
  search?: string
  city?: string
  category?: string
  dateFrom?: number
  dateTo?: number
  lat?: number
  lng?: number
  /** e.g. `25km` — passed through to discovery/geo search */
  radius?: string
  minPrice?: number
  maxPrice?: number
  /** Session mode used as venue-type filter: OFFLINE | ONLINE | HYBRID */
  mode?: 'OFFLINE' | 'ONLINE' | 'HYBRID'
}

export type DiscoveryFeedSectionKey = 'tonight' | 'thisWeekend' | 'upcoming'

export interface DiscoveryFeedSection {
  key: DiscoveryFeedSectionKey | string
  label: string
  data: Event[]
}

export interface DiscoveryFeedResponse {
  sections: DiscoveryFeedSection[]
}

export interface CreateEventInput {
  title: string
  description?: string
  slug?: string
}

export interface UpdateEventInput {
  title?: string
  description?: string
  slug?: string
}

export type LocationType = 'VENUE' | 'ONLINE' | 'RECORDED'
