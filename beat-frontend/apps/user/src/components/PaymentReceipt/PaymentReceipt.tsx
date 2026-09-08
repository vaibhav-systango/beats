'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { getAccessToken, getApiErrorMessage, getPayment, type PaymentResponse } from '@beat/api-client'
import { formatEventDateTime } from '@beat/utils'

import { RECEIPT_COPY, USER_ROUTES } from '@/constants'
import { formatTicketPrice } from '@/lib'
import { useAuthStore } from '@/store/auth.store'

type PaymentReceiptProps = {
  paymentId: string
}

export function PaymentReceipt({ paymentId }: PaymentReceiptProps) {
  const { isAuthenticated } = useAuthStore()
  const [authReady, setAuthReady] = useState(false)
  const [payment, setPayment] = useState<PaymentResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const origin = useMemo(() => {
    if (typeof window === 'undefined') return ''
    return window.location.origin
  }, [])

  useEffect(() => {
    setAuthReady(true)
  }, [])

  useEffect(() => {
    if (!authReady) return

    const hasToken = Boolean(getAccessToken())
    if (!isAuthenticated && !hasToken) {
      setError(RECEIPT_COPY.SIGN_IN_REQUIRED)
      setLoading(false)
      return
    }

    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const response = await getPayment(paymentId)
        if (!cancelled) setPayment(response)
      } catch (err) {
        if (!cancelled) {
          setError(getApiErrorMessage(err) ?? RECEIPT_COPY.MISSING)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [authReady, isAuthenticated, paymentId])

  if (loading) {
    return (
      <section className="mx-auto max-w-3xl px-6 py-16 text-muted-foreground">
        {RECEIPT_COPY.LOADING}
      </section>
    )
  }

  if (error || !payment) {
    return (
      <section className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-destructive">{error || RECEIPT_COPY.MISSING}</p>
        <Link
          href={USER_ROUTES.HOME}
          className="mt-6 inline-flex text-sm text-primary hover:underline"
        >
          {RECEIPT_COPY.BACK_HOME}
        </Link>
      </section>
    )
  }

  const tickets = payment.tickets ?? []
  const statusLabel =
    payment.status === 'SUCCEEDED'
      ? payment.amount === 0
        ? RECEIPT_COPY.FREE
        : RECEIPT_COPY.PAID
      : payment.status

  return (
    <section className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">
        {RECEIPT_COPY.TITLE}
      </h1>
      <p className="mt-2 text-muted-foreground">{RECEIPT_COPY.SUBTITLE}</p>

      <div className="mt-8 rounded-xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Payment</p>
            <p className="font-mono text-sm text-foreground">{payment.id}</p>
            <p className="mt-3 text-sm text-muted-foreground">
              {formatEventDateTime(payment.createdAt)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-accent">{statusLabel}</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">
              {formatTicketPrice(payment.amount)}
            </p>
            <p className="text-xs text-muted-foreground">{payment.provider}</p>
          </div>
        </div>
      </div>

      <h2 className="mt-10 text-xl font-semibold text-foreground">
        {RECEIPT_COPY.TICKETS_HEADING}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">{RECEIPT_COPY.SCAN_HINT}</p>

      {tickets.length === 0 ? (
        <p className="mt-6 rounded-lg border border-border bg-card px-4 py-8 text-center text-muted-foreground">
          {RECEIPT_COPY.TICKETS_PENDING}
        </p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {tickets.map((ticket, index) => {
            const scanUrl = `${origin}${USER_ROUTES.TICKET(ticket.id)}`
            return (
              <article
                key={ticket.id}
                className="flex flex-col items-center rounded-xl border border-border bg-card p-5 text-center"
              >
                <div className="rounded-lg bg-white p-3">
                  <QRCodeSVG value={scanUrl} size={168} level="M" includeMargin />
                </div>
                <p className="mt-4 text-sm font-medium text-accent">
                  Ticket {index + 1} · {ticket.ticketTypeName}
                </p>
                <p className="mt-1 text-base font-semibold text-foreground">
                  {ticket.eventTitle}
                </p>
                {ticket.sessionTitle || ticket.sessionStartAt ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {[ticket.sessionTitle, ticket.sessionStartAt ? formatEventDateTime(ticket.sessionStartAt) : null]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                ) : null}
                {(ticket.venue || ticket.city) && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {[ticket.venue, ticket.city].filter(Boolean).join(' · ')}
                  </p>
                )}
                <p className="mt-3 font-mono text-xs text-muted-foreground">
                  {RECEIPT_COPY.TICKET_ID}: {ticket.id}
                </p>
                <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
                  {RECEIPT_COPY.STATUS}: {ticket.status}
                </p>
                <Link
                  href={USER_ROUTES.TICKET(ticket.id)}
                  className="mt-3 text-sm text-primary hover:underline"
                >
                  Open ticket
                </Link>
              </article>
            )
          })}
        </div>
      )}

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href={USER_ROUTES.HOME}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          {RECEIPT_COPY.BACK_HOME}
        </Link>
        <Link
          href={USER_ROUTES.EVENTS}
          className="rounded-md border border-border px-4 py-2 text-sm text-foreground"
        >
          {RECEIPT_COPY.BACK_EVENTS}
        </Link>
      </div>
    </section>
  )
}
