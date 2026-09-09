export type PaymentStatus =
  | 'CREATED'
  | 'PENDING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED'

export type PaymentAttendeeInput = {
  guestName?: string
  guestAge?: number
}

export type CreatePaymentItem = {
  ticketTypeId: string
  quantity: number
  attendees?: PaymentAttendeeInput[]
}

export type CreatePaymentInput = {
  items: CreatePaymentItem[]
  idempotencyKey?: string
  referrerUserId?: string
  promoterUserId?: string
}

export type RazorpayClientPayload = {
  provider: 'razorpay'
  keyId: string
  orderId: string
  amount: number
  currency: string
}

export type StripeClientPayload = {
  provider: 'stripe'
  publishableKey: string
  clientSecret: string
}

export type PaymentClientPayload = RazorpayClientPayload | StripeClientPayload | {
  provider: string
  [key: string]: string | number
}

export type IssuedTicketReceiptItem = {
  id: string
  ownerUserId: string
  ownerName?: string | null
  status: string
  ticketTypeId: string
  ticketTypeName: string
  price: number
  sessionId: string
  sessionTitle?: string | null
  sessionStartAt?: number | null
  eventId: string
  eventTitle: string
  city?: string | null
  venue?: string | null
  guestName?: string | null
  guestAge?: number | null
  createdAt: number
}

export type PaymentResponse = {
  id: string
  status: PaymentStatus
  amount: number
  currency: string
  provider: string
  failureCode?: string | null
  failureMessage?: string | null
  referrerUserId?: string | null
  createdAt: number
  updatedAt: number
  client?: PaymentClientPayload | null
  tickets?: IssuedTicketReceiptItem[]
}

export type IssuedTicketPublic = {
  id: string
  status: string
  ticketTypeName: string
  price: number
  eventTitle: string
  sessionTitle?: string | null
  sessionStartAt?: number | null
  city?: string | null
  venue?: string | null
  createdAt: number
}

export type VerifyPaymentInput = {
  providerPaymentId?: string
  providerOrderId?: string
  signature?: string
}
