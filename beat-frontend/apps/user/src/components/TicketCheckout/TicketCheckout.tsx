'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Script from 'next/script'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  createPayment,
  fetchPublicEventById,
  fetchSessionTickets,
  getAccessToken,
  getApiErrorMessage,
  verifyPayment,
  type RazorpayClientPayload,
  type SessionTicketItem,
  type SessionTicketsResponse,
} from '@beat/api-client'
import type { EventWithSessions } from '@beat/types'
import { formatEventDateTime } from '@beat/utils'

import { Button } from '@/components/ui'
import { EVENT_TICKETS_COPY, USER_ROUTES } from '@/constants'
import { formatTicketPrice } from '@/lib'
import { useAuthStore } from '@/store/auth.store'

type TicketCheckoutProps = {
  eventId: string
}

type RazorpaySuccessResponse = {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

type RazorpayCheckoutInstance = {
  open: () => void
  on: (event: string, handler: (response: unknown) => void) => void
}

type RazorpayConstructor = new (options: Record<string, unknown>) => RazorpayCheckoutInstance

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor
  }
}

function checkoutErrorMessage(error: unknown, fallback: string): string {
  const message = getApiErrorMessage(error) ?? (error instanceof Error ? error.message : null) ?? fallback
  if (message === 'Network Error' || message === 'Network error') {
    return 'Cannot reach the Beats API. Confirm the backend is running on http://localhost:3000 and try again.'
  }
  return message
}

function isRazorpayClient(client: unknown): client is RazorpayClientPayload {
  return (
    !!client &&
    typeof client === 'object' &&
    (client as RazorpayClientPayload).provider === 'razorpay' &&
    typeof (client as RazorpayClientPayload).keyId === 'string' &&
    typeof (client as RazorpayClientPayload).orderId === 'string'
  )
}

function waitForRazorpay(timeoutMs = 10_000): Promise<RazorpayConstructor> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Razorpay checkout is unavailable'))
  }
  if (window.Razorpay) return Promise.resolve(window.Razorpay)

  return new Promise((resolve, reject) => {
    const started = Date.now()
    const timer = window.setInterval(() => {
      if (window.Razorpay) {
        window.clearInterval(timer)
        resolve(window.Razorpay)
        return
      }
      if (Date.now() - started >= timeoutMs) {
        window.clearInterval(timer)
        reject(new Error('Failed to load Razorpay'))
      }
    }, 50)
  })
}

function normalizeCatalog(response: SessionTicketsResponse): SessionTicketsResponse {
  return {
    ...response,
    sessionId: response.sessionId.trim(),
    eventId: response.eventId.trim(),
    tickets: response.tickets.map((ticket) => ({
      ...ticket,
      id: ticket.id.trim(),
    })),
  }
}

export function TicketCheckout({ eventId }: TicketCheckoutProps) {
  const router = useRouter()
  const { isAuthenticated, user } = useAuthStore()
  const [authReady, setAuthReady] = useState(false)

  const [event, setEvent] = useState<EventWithSessions | null>(null)
  const [selectedSessionId, setSelectedSessionId] = useState('')
  const [catalog, setCatalog] = useState<SessionTicketsResponse | null>(null)
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [loadingEvent, setLoadingEvent] = useState(true)
  const [loadingTickets, setLoadingTickets] = useState(false)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const idempotencyKeyRef = useRef<string | null>(null)

  useEffect(() => {
    setAuthReady(true)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadEvent() {
      setLoadingEvent(true)
      setError(null)
      try {
        const details = await fetchPublicEventById(eventId)
        if (cancelled) return
        setEvent(details)
        setSelectedSessionId(details.sessions?.[0]?.id?.trim() ?? '')
      } catch (err) {
        if (!cancelled) setError(checkoutErrorMessage(err, 'Failed to load event'))
      } finally {
        if (!cancelled) setLoadingEvent(false)
      }
    }

    void loadEvent()
    return () => {
      cancelled = true
    }
  }, [eventId])

  useEffect(() => {
    if (!selectedSessionId) {
      setCatalog(null)
      return
    }

    let cancelled = false

    async function loadTickets() {
      setLoadingTickets(true)
      setError(null)
      try {
        const response = normalizeCatalog(await fetchSessionTickets(selectedSessionId))
        if (cancelled) return
        setCatalog(response)
        setQuantities(
          Object.fromEntries(response.tickets.map((ticket) => [ticket.id, 0]))
        )
      } catch (err) {
        if (!cancelled) {
          setError(checkoutErrorMessage(err, 'Failed to load tickets'))
          setCatalog(null)
        }
      } finally {
        if (!cancelled) setLoadingTickets(false)
      }
    }

    void loadTickets()
    return () => {
      cancelled = true
    }
  }, [selectedSessionId])

  const selectedItems = useMemo(() => {
    if (!catalog) return [] as Array<{ ticket: SessionTicketItem; quantity: number }>
    return catalog.tickets
      .map((ticket) => ({
        ticket,
        quantity: quantities[ticket.id] ?? 0,
      }))
      .filter((row) => row.quantity > 0)
  }, [catalog, quantities])

  const cartFingerprint = useMemo(
    () =>
      selectedItems
        .map((row) => `${row.ticket.id}:${row.quantity}`)
        .sort()
        .join('|'),
    [selectedItems]
  )

  useEffect(() => {
    idempotencyKeyRef.current = null
  }, [cartFingerprint, eventId, selectedSessionId])

  const total = useMemo(
    () => selectedItems.reduce((sum, row) => sum + row.ticket.price * row.quantity, 0),
    [selectedItems]
  )

  const setQuantity = useCallback((ticketId: string, next: number) => {
    setQuantities((current) => ({
      ...current,
      [ticketId]: Math.max(0, next),
    }))
  }, [])

  const requireAuth = useCallback(() => {
    if (isAuthenticated || getAccessToken()) return true
    router.push(
      `${USER_ROUTES.LOGIN}?next=${encodeURIComponent(USER_ROUTES.EVENT_TICKETS(eventId))}`
    )
    return false
  }, [eventId, isAuthenticated, router])

  const openRazorpayCheckout = useCallback(
    async (paymentId: string, client: RazorpayClientPayload) => {
      const Razorpay = await waitForRazorpay()
      const checkout = new Razorpay({
        key: client.keyId,
        amount: client.amount,
        currency: client.currency,
        order_id: client.orderId,
        name: 'Beats',
        description: catalog?.eventTitle || event?.title || 'Event tickets',
        prefill: {
          name: user?.fullName ?? undefined,
          email: user?.email ?? undefined,
          contact: user?.phone ?? undefined,
        },
        theme: { color: '#8b5cf6' },
        modal: {
          ondismiss: () => {
            setPaying(false)
          },
        },
        handler: async (response: RazorpaySuccessResponse) => {
          try {
            setPaying(true)
            const verified = await verifyPayment(paymentId, {
              providerPaymentId: response.razorpay_payment_id,
              providerOrderId: response.razorpay_order_id,
              signature: response.razorpay_signature,
            })
            if (verified.status === 'SUCCEEDED') {
              idempotencyKeyRef.current = null
              router.push(USER_ROUTES.PAYMENT_RECEIPT(paymentId))
              return
            }
            setError(
              verified.failureMessage ||
                `Payment status: ${verified.status}. Please contact support if charged.`
            )
          } catch (err) {
            setError(
              checkoutErrorMessage(
                err,
                'Payment verification failed. If you were charged, contact support.'
              )
            )
          } finally {
            setPaying(false)
          }
        },
      })

      checkout.on('payment.failed', (response: unknown) => {
        const description =
          typeof response === 'object' &&
          response &&
          'error' in response &&
          typeof (response as { error?: { description?: string } }).error?.description ===
            'string'
            ? (response as { error: { description: string } }).error.description
            : 'Payment failed'
        setError(description)
        setPaying(false)
      })

      checkout.open()
    },
    [catalog?.eventTitle, event?.title, router, user?.email, user?.fullName, user?.phone]
  )

  const handlePay = async () => {
    if (paying) return
    setError(null)
    if (!requireAuth()) return
    if (selectedItems.length === 0) {
      setError(EVENT_TICKETS_COPY.SELECT_TICKETS)
      return
    }

    setPaying(true)
    try {
      if (!idempotencyKeyRef.current) {
        idempotencyKeyRef.current = crypto.randomUUID()
      }

      const payment = await createPayment({
        items: selectedItems.map((row) => ({
          ticketTypeId: row.ticket.id,
          quantity: row.quantity,
        })),
        idempotencyKey: idempotencyKeyRef.current,
      })

      if (payment.status === 'SUCCEEDED') {
        idempotencyKeyRef.current = null
        router.push(USER_ROUTES.PAYMENT_RECEIPT(payment.id))
        return
      }

      if (!isRazorpayClient(payment.client)) {
        throw new Error(
          'Checkout is not configured for Razorpay. Ask an admin to set PAYMENT_PROVIDER=razorpay.'
        )
      }

      // Keep `paying` true while the Razorpay modal is open; dismiss/fail/verify clear it.
      await openRazorpayCheckout(payment.id, payment.client)
    } catch (err) {
      setError(checkoutErrorMessage(err, 'Could not start checkout'))
      setPaying(false)
    }
  }

  if (loadingEvent) {
    return (
      <section className="mx-auto max-w-3xl px-6 py-16 text-muted-foreground">
        {EVENT_TICKETS_COPY.LOADING}
      </section>
    )
  }

  if (!event) {
    return (
      <section className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-destructive">{error || EVENT_TICKETS_COPY.EVENT_MISSING}</p>
        <Link
          href={USER_ROUTES.EVENTS}
          className="mt-6 inline-flex text-sm text-primary hover:underline"
        >
          {EVENT_TICKETS_COPY.BACK_TO_EVENTS}
        </Link>
      </section>
    )
  }

  const sessions = event.sessions ?? []

  return (
    <section className="mx-auto max-w-3xl px-6 py-10">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
        data-beats-razorpay="true"
      />

      <Link
        href={USER_ROUTES.EVENT_DETAIL(eventId)}
        className="text-sm text-muted-foreground transition-colors hover:text-primary"
      >
        ← {EVENT_TICKETS_COPY.BACK_TO_EVENT}
      </Link>

      <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground">
        {EVENT_TICKETS_COPY.TITLE}
      </h1>
      <p className="mt-2 text-muted-foreground">{event.title}</p>

      {sessions.length > 1 ? (
        <div className="mt-8 space-y-2">
          <label htmlFor="session" className="text-sm font-medium text-foreground">
            {EVENT_TICKETS_COPY.SESSION_LABEL}
          </label>
          <select
            id="session"
            value={selectedSessionId}
            onChange={(eventChange) =>
              setSelectedSessionId(eventChange.target.value.trim())
            }
            className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground [color-scheme:dark]"
          >
            {sessions.map((session) => {
              const sessionId = session.id.trim()
              return (
                <option key={sessionId} value={sessionId}>
                  {(session.title || event.title) +
                    (session.startAt ? ` · ${formatEventDateTime(session.startAt)}` : '')}
                </option>
              )
            })}
          </select>
        </div>
      ) : null}

      {error ? (
        <div
          role="alert"
          className="mt-6 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      ) : null}

      <div className="mt-8 space-y-3">
        {loadingTickets ? (
          <p className="text-muted-foreground">{EVENT_TICKETS_COPY.LOADING_TICKETS}</p>
        ) : !catalog || catalog.tickets.length === 0 ? (
          <p className="rounded-lg border border-border bg-card px-4 py-8 text-center text-muted-foreground">
            {EVENT_TICKETS_COPY.EMPTY}
          </p>
        ) : (
          catalog.tickets.map((ticket) => {
            const qty = quantities[ticket.id] ?? 0
            const maxQty = Math.min(
              ticket.maxPurchaseLimit || 10,
              ticket.remainingQuantity || 0
            )
            const disabled = !ticket.canPurchase || ticket.isSoldOut || maxQty <= 0

            return (
              <div
                key={ticket.id}
                className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-foreground">{ticket.name}</p>
                  {ticket.description ? (
                    <p className="mt-1 text-sm text-muted-foreground">{ticket.description}</p>
                  ) : null}
                  <p className="mt-2 text-sm text-accent">
                    {formatTicketPrice(ticket.price)}
                    {ticket.isSoldOut ? ' · Sold out' : ` · ${ticket.remainingQuantity} left`}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    disabled={disabled || qty <= 0 || paying}
                    onClick={() => setQuantity(ticket.id, qty - 1)}
                    aria-label={`Decrease ${ticket.name}`}
                  >
                    −
                  </Button>
                  <span className="min-w-8 text-center text-sm font-medium">{qty}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    disabled={disabled || qty >= maxQty || paying}
                    onClick={() => setQuantity(ticket.id, qty + 1)}
                    aria-label={`Increase ${ticket.name}`}
                  >
                    +
                  </Button>
                </div>
              </div>
            )
          })
        )}
      </div>

      <div className="sticky bottom-4 mt-8 rounded-lg border border-border bg-background/95 p-4 shadow-lg backdrop-blur">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{EVENT_TICKETS_COPY.TOTAL}</p>
            <p className="text-xl font-semibold text-foreground">
              {formatTicketPrice(total)}
            </p>
            {authReady && !isAuthenticated && !getAccessToken() ? (
              <p className="mt-1 text-xs text-muted-foreground">
                {EVENT_TICKETS_COPY.SIGN_IN_HINT}
              </p>
            ) : null}
          </div>
          <Button
            type="button"
            size="lg"
            disabled={paying || selectedItems.length === 0}
            onClick={() => void handlePay()}
            className="min-w-[10rem]"
          >
            {paying ? EVENT_TICKETS_COPY.PROCESSING : EVENT_TICKETS_COPY.PAY_CTA}
          </Button>
        </div>
      </div>
    </section>
  )
}
