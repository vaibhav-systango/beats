import { API_CONSTANTS } from '../../../constants/api.constants'
import { apiClient } from '../../../axios/axios'
import { rethrowWithApiMessage } from '../../../lib/apiErrorMessage'

import type {
  CreatePaymentInput,
  IssuedTicketPublic,
  PaymentResponse,
  VerifyPaymentInput,
} from './payments.types'

/**
 * POST /api/v1/payments — Create a payment (JWT required).
 */
export async function createPayment(
  input: CreatePaymentInput
): Promise<PaymentResponse> {
  try {
    const { data } = await apiClient.post<PaymentResponse>(
      API_CONSTANTS.PAYMENTS,
      input
    )
    return data
  } catch (error) {
    rethrowWithApiMessage(error)
  }
}

/**
 * POST /api/v1/payments/:id/verify — Confirm provider payment (JWT required).
 */
export async function verifyPayment(
  paymentId: string,
  input: VerifyPaymentInput
): Promise<PaymentResponse> {
  try {
    const { data } = await apiClient.post<PaymentResponse>(
      API_CONSTANTS.PAYMENT_VERIFY(paymentId.trim()),
      input
    )
    return data
  } catch (error) {
    rethrowWithApiMessage(error)
  }
}

/**
 * GET /api/v1/payments/:id — Payment status (+ issued tickets when succeeded).
 */
export async function getPayment(paymentId: string): Promise<PaymentResponse> {
  try {
    const { data } = await apiClient.get<PaymentResponse>(
      API_CONSTANTS.PAYMENT_BY_ID(paymentId.trim())
    )
    return {
      ...data,
      id: data.id.trim(),
      tickets: data.tickets?.map((ticket) => ({
        ...ticket,
        id: ticket.id.trim(),
        ticketTypeId: ticket.ticketTypeId.trim(),
        sessionId: ticket.sessionId.trim(),
        eventId: ticket.eventId.trim(),
      })),
    }
  } catch (error) {
    rethrowWithApiMessage(error)
  }
}

/**
 * GET /api/v1/payments/issued-tickets/:id — Public ticket lookup for QR scans.
 */
export async function fetchIssuedTicket(
  ticketId: string
): Promise<IssuedTicketPublic> {
  try {
    const { data } = await apiClient.get<IssuedTicketPublic>(
      API_CONSTANTS.ISSUED_TICKET_BY_ID(ticketId.trim())
    )
    return { ...data, id: data.id.trim() }
  } catch (error) {
    rethrowWithApiMessage(error)
  }
}
