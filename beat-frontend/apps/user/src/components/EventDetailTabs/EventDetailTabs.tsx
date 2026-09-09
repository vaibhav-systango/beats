'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { getAccessToken } from '@beat/api-client'
import type { EventWithSessions } from '@beat/types'
import { formatEventDateTime } from '@beat/utils'

import { EVENT_DETAIL_COPY, USER_ROUTES } from '@/constants'
import { captureReferrerFromSearch, formatTicketPrice } from '@/lib'
import { useAuthStore } from '@/store/auth.store'

type EventDetailTabsProps = {
  event: EventWithSessions
  ticketsHref: string
  locationLabel: string
}

type DetailTab = 'overview' | 'tickets' | 'resale' | 'faq'

function lineupArtists(event: EventWithSessions) {
  const artists: Array<{ name: string; category?: string; socialMediaUrl?: string }> = []
  for (const session of event.sessions ?? []) {
    const meta = session.artistMetadata
    if (!meta) continue
    const list = Array.isArray(meta) ? meta : [meta]
    for (const artist of list) {
      if (artist?.name?.trim()) {
        artists.push({
          name: artist.name.trim(),
          category: artist.category,
          socialMediaUrl: safeHttpUrl(artist.socialMediaUrl),
        })
      }
    }
  }
  return artists
}

/** Allow only http(s) profile links; drop javascript: and other schemes. */
function safeHttpUrl(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim()
  if (!trimmed) return undefined
  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.href
    }
  } catch {
    // invalid URL
  }
  return undefined
}

function faqDocuments(event: EventWithSessions) {
  const docs: Array<{ name: string; url: string }> = []
  for (const session of event.sessions ?? []) {
    const media = session.eventSessionMedias
    const pools = [
      ...(media?.documents ?? []),
      ...(media?.legal_documents ?? []),
    ]
    for (const doc of pools) {
      if (doc.doc_type?.toLowerCase() === 'faq' && doc.url) {
        docs.push({
          name: doc.original_name || 'FAQ',
          url: doc.url,
        })
      }
    }
  }
  return docs
}

export function EventDetailTabs({
  event,
  ticketsHref,
  locationLabel,
}: EventDetailTabsProps) {
  const { isAuthenticated } = useAuthStore()
  const [authReady, setAuthReady] = useState(false)
  const [tab, setTab] = useState<DetailTab>('overview')
  const sessions = event.sessions ?? []
  const primary = sessions[0]
  const artists = useMemo(() => lineupArtists(event), [event])
  const faqs = useMemo(() => faqDocuments(event), [event])
  const mapLat = primary?.location?.latitude
  const mapLng = primary?.location?.longitude
  const hasMap =
    typeof mapLat === 'number' &&
    typeof mapLng === 'number' &&
    Number.isFinite(mapLat) &&
    Number.isFinite(mapLng)

  useEffect(() => {
    setAuthReady(true)
  }, [])

  useEffect(() => {
    captureReferrerFromSearch(window.location.search)
  }, [])

  const canViewTickets =
    authReady && (isAuthenticated || !!getAccessToken())

  useEffect(() => {
    if (authReady && !canViewTickets && (tab === 'tickets' || tab === 'resale')) {
      setTab('overview')
    }
  }, [authReady, canViewTickets, tab])

  const tabs: Array<{ id: DetailTab; label: string }> = [
    { id: 'overview', label: EVENT_DETAIL_COPY.TAB_OVERVIEW },
    ...(canViewTickets
      ? [
          { id: 'tickets' as const, label: EVENT_DETAIL_COPY.TAB_TICKETS },
          { id: 'resale' as const, label: EVENT_DETAIL_COPY.TAB_RESALE },
        ]
      : []),
    { id: 'faq', label: EVENT_DETAIL_COPY.TAB_FAQ },
  ]

  const loginHref = `${USER_ROUTES.LOGIN}?next=${encodeURIComponent(ticketsHref)}`

  return (
    <div>
      <div className="mt-8 flex flex-wrap gap-2 border-b border-border pb-2">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={
              tab === item.id
                ? 'rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground'
                : 'rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground'
            }
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'overview' ? (
        <div className="mt-8 space-y-10">
          {event.description ? (
            <section>
              <h2 className="text-lg font-semibold text-foreground">
                {EVENT_DETAIL_COPY.ABOUT}
              </h2>
              <p className="mt-3 whitespace-pre-wrap text-muted-foreground">
                {event.description}
              </p>
            </section>
          ) : null}

          {sessions.length > 0 ? (
            <section>
              <h2 className="text-lg font-semibold text-foreground">
                {EVENT_DETAIL_COPY.SESSIONS}
              </h2>
              <ul className="mt-3 space-y-3">
                {sessions.map((session) => (
                  <li
                    key={session.id}
                    className="rounded-lg border border-border bg-card px-4 py-3"
                  >
                    <p className="font-medium text-foreground">
                      {session.title || event.title}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {session.startAt
                        ? formatEventDateTime(session.startAt)
                        : EVENT_DETAIL_COPY.DATE_TBA}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {[session.eventAddress?.venueName, session.eventAddress?.city]
                        .filter(Boolean)
                        .join(' · ') || locationLabel}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section>
            <h2 className="text-lg font-semibold text-foreground">
              {EVENT_DETAIL_COPY.MAP_HEADING}
            </h2>
            {hasMap ? (
              <div className="mt-3 overflow-hidden rounded-lg border border-border">
                <iframe
                  title={EVENT_DETAIL_COPY.MAP_HEADING}
                  className="h-64 w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://maps.google.com/maps?q=${mapLat},${mapLng}&z=15&output=embed`}
                />
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                {EVENT_DETAIL_COPY.MAP_MISSING}
              </p>
            )}
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">
              {EVENT_DETAIL_COPY.LINEUP_HEADING}
            </h2>
            {artists.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                {EVENT_DETAIL_COPY.LINEUP_EMPTY}
              </p>
            ) : (
              <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                {artists.map((artist) => (
                  <li
                    key={`${artist.name}-${artist.socialMediaUrl ?? ''}`}
                    className="rounded-lg border border-border bg-card px-4 py-3"
                  >
                    <p className="font-medium text-foreground">{artist.name}</p>
                    {artist.category ? (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {artist.category}
                      </p>
                    ) : null}
                    {artist.socialMediaUrl ? (
                      <a
                        href={artist.socialMediaUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex text-sm text-primary hover:underline"
                      >
                        Profile
                      </a>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {!canViewTickets ? (
            <div className="rounded-lg border border-border bg-card px-4 py-5">
              <p className="text-sm text-muted-foreground">
                {EVENT_DETAIL_COPY.TICKETS_SIGN_IN_REQUIRED}
              </p>
              <Link
                href={loginHref}
                className="mt-4 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                {EVENT_DETAIL_COPY.SIGN_IN_TO_BUY}
              </Link>
            </div>
          ) : null}
        </div>
      ) : null}

      {tab === 'tickets' && canViewTickets ? (
        <div className="mt-8 space-y-4">
          <p className="text-muted-foreground">{EVENT_DETAIL_COPY.TICKETS_TAB_HINT}</p>
          {(primary?.ticketTypes ?? []).length > 0 ? (
            <ul className="space-y-3">
              {(primary?.ticketTypes ?? []).map((ticket) => (
                <li
                  key={ticket.id ?? ticket.name}
                  className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-foreground">{ticket.name}</p>
                    {ticket.description ? (
                      <p className="text-sm text-muted-foreground">{ticket.description}</p>
                    ) : null}
                  </div>
                  <p className="text-sm font-medium text-accent">
                    {formatTicketPrice(ticket.price)}
                  </p>
                </li>
              ))}
            </ul>
          ) : null}
          <Link
            href={ticketsHref}
            className="inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            {EVENT_DETAIL_COPY.GET_TICKETS}
          </Link>
        </div>
      ) : null}

      {tab === 'resale' && canViewTickets ? (
        <p className="mt-8 rounded-lg border border-border bg-card px-4 py-8 text-center text-muted-foreground">
          {EVENT_DETAIL_COPY.RESALE_COMING_SOON}
        </p>
      ) : null}

      {tab === 'faq' ? (
        <div className="mt-8">
          {faqs.length === 0 ? (
            <p className="text-muted-foreground">{EVENT_DETAIL_COPY.FAQ_EMPTY}</p>
          ) : (
            <ul className="space-y-3">
              {faqs.map((faq) => (
                <li key={faq.url}>
                  <a
                    href={faq.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline"
                  >
                    {faq.name}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  )
}
