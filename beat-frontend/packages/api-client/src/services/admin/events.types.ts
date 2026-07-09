import type { ReviewEventAction } from '@beat/types'

export type { AdminEventsListParams as UseAdminPendingEventsParams } from '@beat/types'

export interface ReviewEventResponse {
  message: string
}

export interface ReviewEventMutationInput {
  eventId: string
  action: ReviewEventAction
  reason?: string
}
