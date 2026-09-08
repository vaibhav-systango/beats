export type SessionTicketItem = {
  id: string
  name: string
  description?: string | null
  price: number
  quantity: number
  remainingQuantity: number
  maxPurchaseLimit: number
  saleStartAt: number
  saleEndAt: number
  isSoldOut: boolean
  canPurchase: boolean
}

export type SessionTicketsResponse = {
  sessionId: string
  sessionTitle?: string | null
  eventId: string
  eventTitle: string
  ticketSaleStartAt: number
  ticketSaleEndAt: number
  tickets: SessionTicketItem[]
}
