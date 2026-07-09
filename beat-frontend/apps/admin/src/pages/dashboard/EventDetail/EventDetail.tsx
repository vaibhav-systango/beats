import { Button } from '@beat/ui'
import { formatEventDateTime } from '@beat/utils'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import {
  ActionFeedbackBanner,
  DashboardPage,
  DashboardPageHeader,
  DashboardPageSection,
  RejectEventDialog,
} from '@/components'
import { ADMIN_EVENTS_COPY } from '@/constants/events.constants'
import { ADMIN_PATHS } from '@/constants/routes.constants'
import { mockEventActionDelay } from '@/lib/mock-event-actions'
import type { AdminEventDetail, AdminEventLocationType, AdminEventSession } from '@/mocks/admin-event.types'
import { useMockPendingEventsStore } from '@/store'

type ActionFeedback = {
  message: string
  variant: 'success' | 'error'
}

function formatTicketPrice(price: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price)
}

function locationLabel(locationType: AdminEventLocationType): string {
  switch (locationType) {
    case 'VENUE':
      return ADMIN_EVENTS_COPY.DETAIL_LOCATION_VENUE
    case 'ONLINE':
      return ADMIN_EVENTS_COPY.DETAIL_LOCATION_ONLINE
    case 'RECORDED':
      return ADMIN_EVENTS_COPY.DETAIL_LOCATION_RECORDED
  }
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="text-sm text-foreground">{value}</dd>
    </div>
  )
}

function SessionCard({ session }: { session: AdminEventSession }) {
  return (
    <article className="space-y-6 border-b border-border p-4 last:border-b-0 sm:p-6">
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-foreground">{session.title}</h3>
        <p className="text-sm text-muted-foreground">
          {locationLabel(session.locationType)}
          {session.venueName ? ` · ${session.venueName}` : ''}
        </p>
      </div>

      <dl className="grid gap-4 sm:grid-cols-2">
        <DetailField
          label={ADMIN_EVENTS_COPY.DETAIL_START_LABEL}
          value={formatEventDateTime(session.startAt)}
        />
        <DetailField
          label={ADMIN_EVENTS_COPY.DETAIL_END_LABEL}
          value={formatEventDateTime(session.endAt)}
        />
      </dl>

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-foreground">
          {ADMIN_EVENTS_COPY.DETAIL_TICKETS_TITLE}
        </h4>
        {session.ticketTypes.length === 0 ? (
          <p className="text-sm text-muted-foreground">{ADMIN_EVENTS_COPY.DETAIL_NO_TICKETS}</p>
        ) : (
          <ul className="divide-y divide-border rounded-md border border-border">
            {session.ticketTypes.map((ticket) => (
              <li
                key={ticket.name}
                className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
              >
                <span className="font-medium text-foreground">{ticket.name}</span>
                <span className="text-muted-foreground">
                  {formatTicketPrice(ticket.price)} · {ticket.quantity} qty
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-foreground">{ADMIN_EVENTS_COPY.DETAIL_MEDIA_TITLE}</h4>
        {!session.bannerUrl && (!session.galleryUrls || session.galleryUrls.length === 0) ? (
          <p className="text-sm text-muted-foreground">{ADMIN_EVENTS_COPY.DETAIL_NO_MEDIA}</p>
        ) : (
          <div className="space-y-4">
            {session.bannerUrl ? (
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {ADMIN_EVENTS_COPY.DETAIL_BANNER_LABEL}
                </p>
                <img
                  src={session.bannerUrl}
                  alt=""
                  className="max-h-48 w-full rounded-md border border-border object-cover"
                />
              </div>
            ) : null}
            {session.galleryUrls && session.galleryUrls.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {ADMIN_EVENTS_COPY.DETAIL_GALLERY_LABEL}
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {session.galleryUrls.map((url) => (
                    <img
                      key={url}
                      src={url}
                      alt=""
                      className="aspect-video w-full rounded-md border border-border object-cover"
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </article>
  )
}

function EventDetailContent({ event }: { event: AdminEventDetail }) {
  return (
    <div className="space-y-6">
      <DashboardPageSection className="p-4 sm:p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {ADMIN_EVENTS_COPY.DETAIL_OVERVIEW_TITLE}
        </h2>
        <dl className="grid gap-4 sm:grid-cols-2">
          <DetailField label={ADMIN_EVENTS_COPY.DETAIL_ORGANISER_LABEL} value={event.organiserName} />
          <DetailField
            label={ADMIN_EVENTS_COPY.DETAIL_STATUS_LABEL}
            value={ADMIN_EVENTS_COPY.STATUS_PENDING_APPROVAL}
          />
          <DetailField
            label={ADMIN_EVENTS_COPY.DETAIL_SUBMITTED_LABEL}
            value={formatEventDateTime(event.submittedAt)}
          />
          <DetailField label={ADMIN_EVENTS_COPY.DETAIL_SLUG_LABEL} value={event.slug} />
        </dl>
        <div className="mt-4 space-y-1">
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {ADMIN_EVENTS_COPY.DETAIL_DESCRIPTION_LABEL}
          </dt>
          <dd className="text-sm leading-relaxed text-foreground">{event.description}</dd>
        </div>
      </DashboardPageSection>

      <DashboardPageSection>
        <h2 className="border-b border-border px-4 py-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground sm:px-6">
          {ADMIN_EVENTS_COPY.DETAIL_SESSIONS_TITLE}
        </h2>
        {event.sessions.map((session) => (
          <SessionCard key={session.id} session={session} />
        ))}
      </DashboardPageSection>
    </div>
  )
}

export function EventDetail() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const getPendingEventDetail = useMockPendingEventsStore((state) => state.getPendingEventDetail)
  const removeEvent = useMockPendingEventsStore((state) => state.removeEvent)
  const event = id ? getPendingEventDetail(id) : undefined

  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const [isRejectSubmitting, setIsRejectSubmitting] = useState(false)
  const [actionFeedback, setActionFeedback] = useState<ActionFeedback | null>(null)

  const isActionLoading = isApproving || isRejectSubmitting
  const hasActed = actionFeedback !== null

  const navigateToListWithFeedback = (feedback: ActionFeedback) => {
    navigate(ADMIN_PATHS.EVENTS, { state: { feedback } })
  }

  const handleApprove = async () => {
    if (!event || isActionLoading || hasActed) {
      return
    }

    setIsApproving(true)
    setActionFeedback(null)

    try {
      await mockEventActionDelay()
      removeEvent(event.id)
      navigateToListWithFeedback({
        message: ADMIN_EVENTS_COPY.APPROVE_SUCCESS,
        variant: 'success',
      })
    } catch {
      setActionFeedback({
        message: ADMIN_EVENTS_COPY.ACTION_ERROR,
        variant: 'error',
      })
      setIsApproving(false)
    }
  }

  const handleRejectConfirm = async (_reason: string) => {
    if (!event || isRejectSubmitting || hasActed) {
      return
    }

    setIsRejectSubmitting(true)
    setActionFeedback(null)

    try {
      await mockEventActionDelay()
      removeEvent(event.id)
      setIsRejectDialogOpen(false)
      navigateToListWithFeedback({
        message: ADMIN_EVENTS_COPY.REJECT_SUCCESS,
        variant: 'success',
      })
    } catch {
      setActionFeedback({
        message: ADMIN_EVENTS_COPY.ACTION_ERROR,
        variant: 'error',
      })
      setIsRejectSubmitting(false)
    }
  }

  if (!event) {
    return (
      <DashboardPage width="content">
        <DashboardPageHeader
          title={ADMIN_EVENTS_COPY.NOT_FOUND_TITLE}
          description={ADMIN_EVENTS_COPY.NOT_FOUND_DESCRIPTION}
          backTo={ADMIN_PATHS.EVENTS}
          backLabel={ADMIN_EVENTS_COPY.BACK_TO_EVENTS}
        />
      </DashboardPage>
    )
  }

  return (
    <DashboardPage width="content">
      <DashboardPageHeader
        title={event.title}
        description={event.organiserName}
        backTo={ADMIN_PATHS.EVENTS}
        backLabel={ADMIN_EVENTS_COPY.BACK_TO_EVENTS}
        actions={
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              disabled={isActionLoading || hasActed}
              onClick={handleApprove}
            >
              {ADMIN_EVENTS_COPY.APPROVE_ACTION}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive"
              disabled={isActionLoading || hasActed}
              onClick={() => setIsRejectDialogOpen(true)}
            >
              {ADMIN_EVENTS_COPY.REJECT_ACTION}
            </Button>
          </div>
        }
      />
      {actionFeedback ? (
        <ActionFeedbackBanner
          message={actionFeedback.message}
          variant={actionFeedback.variant}
          className="mb-4"
        />
      ) : null}
      <EventDetailContent event={event} />
      <RejectEventDialog
        open={isRejectDialogOpen}
        eventTitle={event.title}
        isLoading={isRejectSubmitting}
        onCancel={() => {
          if (!isRejectSubmitting) {
            setIsRejectDialogOpen(false)
          }
        }}
        onConfirm={handleRejectConfirm}
      />
    </DashboardPage>
  )
}
