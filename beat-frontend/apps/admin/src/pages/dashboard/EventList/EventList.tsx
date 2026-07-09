import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import {
  ActionFeedbackBanner,
  DashboardPage,
  DashboardPageHeader,
  DashboardPageSection,
  EventModerationTable,
  RejectEventDialog,
} from '@/components'
import { ADMIN_EVENTS_COPY } from '@/constants/events.constants'
import { mockEventActionDelay } from '@/lib/mock-event-actions'
import { useMockPendingEventsStore } from '@/store'

const FEEDBACK_DISMISS_MS = 4_000

type ActionFeedback = {
  message: string
  variant: 'success' | 'error'
}

type EventsLocationState = {
  feedback?: ActionFeedback
}

export function EventList() {
  const navigate = useNavigate()
  const location = useLocation()
  const events = useMockPendingEventsStore((state) => state.events)
  const removeEvent = useMockPendingEventsStore((state) => state.removeEvent)
  const [rejectTarget, setRejectTarget] = useState<{
    id: string
    title: string
  } | null>(null)
  const [loadingEventId, setLoadingEventId] = useState<string | null>(null)
  const [isRejectSubmitting, setIsRejectSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<ActionFeedback | null>(null)

  const isActionLoading = loadingEventId !== null || isRejectSubmitting

  useEffect(() => {
    const state = location.state as EventsLocationState | null
    if (!state?.feedback) {
      return
    }

    setFeedback(state.feedback)
    navigate(location.pathname, { replace: true, state: null })
  }, [location.pathname, location.state, navigate])

  useEffect(() => {
    if (!feedback) {
      return
    }

    const timeoutId = window.setTimeout(() => setFeedback(null), FEEDBACK_DISMISS_MS)
    return () => window.clearTimeout(timeoutId)
  }, [feedback])

  const handleApprove = async (id: string) => {
    if (isActionLoading) {
      return
    }

    setLoadingEventId(id)
    setFeedback(null)

    try {
      await mockEventActionDelay()
      removeEvent(id)
      setFeedback({
        message: ADMIN_EVENTS_COPY.APPROVE_SUCCESS,
        variant: 'success',
      })
    } catch {
      setFeedback({
        message: ADMIN_EVENTS_COPY.ACTION_ERROR,
        variant: 'error',
      })
    } finally {
      setLoadingEventId(null)
    }
  }

  const handleRejectConfirm = async (_reason: string) => {
    if (!rejectTarget || isRejectSubmitting) {
      return
    }

    setIsRejectSubmitting(true)
    setFeedback(null)

    try {
      await mockEventActionDelay()
      removeEvent(rejectTarget.id)
      setRejectTarget(null)
      setFeedback({
        message: ADMIN_EVENTS_COPY.REJECT_SUCCESS,
        variant: 'success',
      })
    } catch {
      setFeedback({
        message: ADMIN_EVENTS_COPY.ACTION_ERROR,
        variant: 'error',
      })
    } finally {
      setIsRejectSubmitting(false)
    }
  }

  const handleRejectOpen = useCallback(
    (id: string) => {
      if (isActionLoading) {
        return
      }

      const event = events.find((item) => item.id === id)
      if (event) {
        setRejectTarget({ id: event.id, title: event.title })
      }
    },
    [events, isActionLoading]
  )

  return (
    <DashboardPage>
      <DashboardPageHeader
        title={ADMIN_EVENTS_COPY.LIST_TITLE}
        description={ADMIN_EVENTS_COPY.LIST_DESCRIPTION}
      />
      {feedback ? (
        <ActionFeedbackBanner
          message={feedback.message}
          variant={feedback.variant}
          className="mb-4"
        />
      ) : null}
      <DashboardPageSection>
        <EventModerationTable
          events={events}
          onApprove={handleApprove}
          onReject={handleRejectOpen}
          isActionLoading={isActionLoading}
          loadingEventId={loadingEventId}
        />
      </DashboardPageSection>
      <RejectEventDialog
        open={rejectTarget !== null}
        eventTitle={rejectTarget?.title ?? ''}
        isLoading={isRejectSubmitting}
        onCancel={() => {
          if (!isRejectSubmitting) {
            setRejectTarget(null)
          }
        }}
        onConfirm={handleRejectConfirm}
      />
    </DashboardPage>
  )
}
