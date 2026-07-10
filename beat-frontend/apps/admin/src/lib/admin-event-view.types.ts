import type { EventStatus } from '@beat/types'

export type AdminEventLocationType = 'VENUE' | 'ONLINE' | 'RECORDED'

export interface AdminEventTicketType {
  name: string
  price: number
  quantity: number
}

export interface AdminEventSession {
  id: string
  title: string
  startAt: number
  endAt: number
  locationType: AdminEventLocationType
  venueName?: string
  ticketTypes: AdminEventTicketType[]
  bannerUrl?: string
  galleryUrls?: string[]
}

/** Read-only admin detail view model (mapped from API). */
export interface AdminEventDetail {
  id: string
  organiserName: string
  title: string
  startAt: number | null
  status: EventStatus
  slug: string
  description: string
  submittedAt: number
  sessions: AdminEventSession[]
}
