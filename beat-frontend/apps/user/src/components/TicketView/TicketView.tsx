'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { fetchIssuedTicket, getApiErrorMessage, type IssuedTicketPublic } from '@beat/api-client'
import { formatEventDateTime } from '@beat/utils'

import { TICKET_SCAN_COPY, USER_ROUTES } from '@/constants'
import { formatTicketPrice } from '@/lib'

type TicketViewProps = {
  ticketId: string
}

export function TicketView({ ticketId }: TicketViewProps) {
  const [ticket, setTicket] = useState<IssuedTicketPublic | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const response = await fetchIssuedTicket(ticketId)
        if (!cancelled) setTicket(response)
      } catch (err) {
        if (!cancelled) {
          setError(getApiErrorMessage(err) ?? TICKET_SCAN_COPY.MISSING)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [ticketId])

  if (loading) {
    return (
      <section className="mx-auto max-w-lg px-6 py-16 text-muted-foreground">
        {TICKET_SCAN_COPY.LOADING}
      </section>
    )
  }

  if (error || !ticket) {
    return (
      <section className="mx-auto max-w-lg px-6 py-16">
        <p className="text-destructive">{error || TICKET_SCAN_COPY.MISSING}</p>
        <Link
          href={USER_ROUTES.HOME}
          className="mt-6 inline-flex text-sm text-primary hover:underline"
        >
          {TICKET_SCAN_COPY.BACK_HOME}
        </Link>
      </section>
    )
  }

  const isValid = ticket.status === 'VALID'

  return (
    <section className="mx-auto max-w-lg px-6 py-12">
      <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-lg shadow-primary/10">
        <p
          className={`text-sm font-semibold uppercase tracking-[0.2em] ${
            isValid ? 'text-accent' : 'text-destructive'
          }`}
        >
          {isValid ? TICKET_SCAN_COPY.VALID : TICKET_SCAN_COPY.VOID}
        </p>
        <h1 className="mt-4 text-2xl font-bold text-foreground">{ticket.eventTitle}</h1>
        <p className="mt-2 text-lg text-primary">{ticket.ticketTypeName}</p>
        <p className="mt-2 text-muted-foreground">{formatTicketPrice(ticket.price)}</p>

        {ticket.sessionTitle || ticket.sessionStartAt ? (
          <p className="mt-4 text-sm text-muted-foreground">
            {[
              ticket.sessionTitle,
              ticket.sessionStartAt ? formatEventDateTime(ticket.sessionStartAt) : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        ) : null}

        {(ticket.venue || ticket.city) && (
          <p className="mt-1 text-sm text-muted-foreground">
            {[ticket.venue, ticket.city].filter(Boolean).join(' · ')}
          </p>
        )}

        <p className="mt-6 font-mono text-xs text-muted-foreground">{ticket.id}</p>
      </div>

      <div className="mt-8 text-center">
        <Link
          href={USER_ROUTES.HOME}
          className="text-sm text-primary hover:underline"
        >
          {TICKET_SCAN_COPY.BACK_HOME}
        </Link>
      </div>
    </section>
  )
}
