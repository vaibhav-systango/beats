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

export interface AdminEventListItem {
  id: string
  organiserName: string
  title: string
  startAt: number | null
  status: 'PENDING_APPROVAL'
}

export interface AdminEventDetail extends AdminEventListItem {
  slug: string
  description: string
  submittedAt: number
  sessions: AdminEventSession[]
}
