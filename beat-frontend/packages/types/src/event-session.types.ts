import type { Event } from './event.types'

export type SessionMode = 'OFFLINE' | 'ONLINE' | 'HYBRID'

export type AgeRestriction =
  | 'ALL'
  | '13_PLUS'
  | '16_PLUS'
  | '18_PLUS'
  | '21_PLUS'

export type SessionStatus = 'ACTIVE' | 'CANCELLED' | 'COMPLETED'

export interface EventAddress {
  placeId?: string
  venueName?: string
  formattedAddress?: string
  addressLine1?: string
  city?: string
  state?: string
  country?: string
  postalCode?: string
}

export interface SessionLocation {
  longitude: number
  latitude: number
}

export interface MediaFile {
  url: string
  mime_type: string
  size: number
  original_name: string
}

export interface GalleryMediaFile extends MediaFile {
  sort_order: number
}

export interface VideoMediaFile extends MediaFile {
  thumbnail_url: string
}

export interface DocumentMediaFile extends MediaFile {
  doc_type: string
}

export interface EventSessionMedias {
  cover?: MediaFile
  gallery?: GalleryMediaFile[]
  venue_gallery?: GalleryMediaFile[]
  videos?: VideoMediaFile[]
  documents?: DocumentMediaFile[]
  legal_documents?: DocumentMediaFile[]
}

export interface SessionTicketType {
  id?: string
  name: string
  description?: string
  price: number
  quantity: number
  maxPurchaseLimit?: number
  saleStartAt: number
  saleEndAt: number
}

export interface EventSession {
  id: string
  eventId: string
  title?: string
  startAt: number
  endAt: number
  location: SessionLocation
  eventAddress: EventAddress
  capacity: number
  ageRestriction?: AgeRestriction
  languages?: string[]
  eventSessionMedias?: EventSessionMedias
  mode?: SessionMode
  ticketSaleStartAt: number
  ticketSaleEndAt: number
  allowReferral?: boolean
  referralRewardPerTicket?: number
  allowPromoters?: boolean
  promoterCommissionPercentage?: number
  status?: SessionStatus
  categoryIds?: string[]
  ticketTypes?: SessionTicketType[]
  createdAt?: number
  updatedAt?: number
}

export interface EventWithSessions extends Event {
  sessions?: EventSession[]
}

export interface CreateSessionInput {
  categoryIds: string[]
  title?: string
  startAt: number
  endAt: number
  location: SessionLocation
  eventAddress: EventAddress
  capacity: number
  ageRestriction?: AgeRestriction
  languages?: string[]
  mode?: SessionMode
  ticketSaleStartAt: number
  ticketSaleEndAt: number
  ticketTypes: SessionTicketType[]
}

export type UpdateSessionInput = Partial<CreateSessionInput>

export interface SubmitEventResponse {
  message?: string
  eventId?: string
}
