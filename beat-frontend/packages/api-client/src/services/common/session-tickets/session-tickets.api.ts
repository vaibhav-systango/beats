import { API_CONSTANTS } from '../../../constants/api.constants'
import { apiClient } from '../../../axios/axios'
import { rethrowWithApiMessage } from '../../../lib/apiErrorMessage'

import type { SessionTicketsResponse } from './session-tickets.types'

/**
 * GET /api/v1/event-sessions/:sessionId/tickets — Public session ticket catalog.
 */
export async function fetchSessionTickets(
  sessionId: string
): Promise<SessionTicketsResponse> {
  try {
    const { data } = await apiClient.get<SessionTicketsResponse>(
      API_CONSTANTS.EVENT_SESSION_TICKETS(sessionId.trim())
    )
    return {
      ...data,
      sessionId: data.sessionId.trim(),
      eventId: data.eventId.trim(),
      tickets: data.tickets.map((ticket) => ({
        ...ticket,
        id: ticket.id.trim(),
      })),
    }
  } catch (error) {
    rethrowWithApiMessage(error)
  }
}
