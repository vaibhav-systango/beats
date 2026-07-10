import type { EventStatus } from '@beat/types'

import { ADMIN_EVENTS_COPY } from '@/constants/events.constants'

export function formatAdminEventStatus(status: EventStatus): string {
  switch (status) {
    case 'PENDING_APPROVAL':
      return ADMIN_EVENTS_COPY.STATUS_PENDING_APPROVAL
    case 'PUBLISHED':
      return ADMIN_EVENTS_COPY.STATUS_PUBLISHED
    case 'APPROVED':
      return ADMIN_EVENTS_COPY.STATUS_APPROVED
    case 'REJECTED':
      return ADMIN_EVENTS_COPY.STATUS_REJECTED
    case 'DRAFT':
      return ADMIN_EVENTS_COPY.STATUS_DRAFT
    case 'CANCELLED':
      return 'Cancelled'
    case 'COMPLETED':
      return 'Completed'
    default:
      return status
  }
}
