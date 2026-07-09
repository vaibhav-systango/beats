import {
  getApiErrorMessage,
  useAdminEvents,
  useReviewEvent,
} from '@beat/api-client'
import type { AdminEventsTab } from '@beat/types'
import { Button } from '@beat/ui'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'

import {
  ActionFeedbackBanner,
  DashboardPage,
  DashboardPageHeader,
  DashboardPageSection,
  EventListTabs,
  EventModerationTable,
  RejectEventDialog,
} from '@/components'
import { ADMIN_EVENTS_COPY } from '@/constants/events.constants'

const FEEDBACK_DISMISS_MS = 4_000
const VALID_TABS: AdminEventsTab[] = ['pending', 'accepted', 'rejected']

type ActionFeedback = {
  message: string
  variant: 'success' | 'error'
}

type EventsLocationState = {
  feedback?: ActionFeedback
}

function parseTabParam(value: string | null): AdminEventsTab {
  if (value && VALID_TABS.includes(value as AdminEventsTab)) {
    return value as AdminEventsTab
  }

  return 'pending'
}

function emptyMessageForTab(tab: AdminEventsTab): string {
  switch (tab) {
    case 'pending':
      return ADMIN_EVENTS_COPY.TABLE_EMPTY_PENDING
    case 'accepted':
      return ADMIN_EVENTS_COPY.TABLE_EMPTY_ACCEPTED
    case 'rejected':
      return ADMIN_EVENTS_COPY.TABLE_EMPTY_REJECTED
  }
}

export function EventList() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = parseTabParam(searchParams.get('tab'))
  const { data, isLoading, isError, error, refetch } = useAdminEvents(activeTab)
  const reviewMutation = useReviewEvent()
  const [rejectTarget, setRejectTarget] = useState<{
    id: string
    title: string
  } | null>(null)
  const [feedback, setFeedback] = useState<ActionFeedback | null>(null)

  const events = data?.data ?? []
  const showActions = activeTab === 'pending'
  const loadingEventId =
    showActions && reviewMutation.isPending
      ? (reviewMutation.variables?.eventId ?? null)
      : null
  const isRejectSubmitting =
    reviewMutation.isPending && reviewMutation.variables?.input.action === 'REJECT'

  const handleTabChange = useCallback(
    (tab: AdminEventsTab) => {
      setRejectTarget(null)
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current)
          if (tab === 'pending') {
            next.delete('tab')
          } else {
            next.set('tab', tab)
          }
          return next
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

  useEffect(() => {
    const state = location.state as EventsLocationState | null
    if (!state?.feedback) {
      return
    }

    setFeedback(state.feedback)
    navigate(location.pathname + location.search, { replace: true, state: null })
  }, [location.pathname, location.search, location.state, navigate])

  useEffect(() => {
    if (!feedback) {
      return
    }

    const timeoutId = window.setTimeout(() => setFeedback(null), FEEDBACK_DISMISS_MS)
    return () => window.clearTimeout(timeoutId)
  }, [feedback])

  const handleApprove = async (id: string) => {
    if (!showActions || reviewMutation.isPending) {
      return
    }

    setFeedback(null)

    try {
      await reviewMutation.mutateAsync({
        eventId: id,
        input: { action: 'APPROVE' },
      })
      setFeedback({
        message: ADMIN_EVENTS_COPY.APPROVE_SUCCESS,
        variant: 'success',
      })
    } catch (mutationError) {
      setFeedback({
        message: getApiErrorMessage(mutationError) ?? ADMIN_EVENTS_COPY.ACTION_ERROR,
        variant: 'error',
      })
    }
  }

  const handleRejectConfirm = async (reason: string) => {
    if (!showActions || !rejectTarget || reviewMutation.isPending) {
      return
    }

    setFeedback(null)

    try {
      await reviewMutation.mutateAsync({
        eventId: rejectTarget.id,
        input: { action: 'REJECT', reason },
      })
      setRejectTarget(null)
      setFeedback({
        message: ADMIN_EVENTS_COPY.REJECT_SUCCESS,
        variant: 'success',
      })
    } catch (mutationError) {
      setFeedback({
        message: getApiErrorMessage(mutationError) ?? ADMIN_EVENTS_COPY.ACTION_ERROR,
        variant: 'error',
      })
    }
  }

  const handleRejectOpen = useCallback(
    (id: string) => {
      if (!showActions || reviewMutation.isPending) {
        return
      }

      const event = events.find((item) => item.id === id)
      if (event) {
        setRejectTarget({ id: event.id, title: event.title })
      }
    },
    [events, reviewMutation.isPending, showActions]
  )

  const listDescription = useMemo(() => {
    switch (activeTab) {
      case 'pending':
        return ADMIN_EVENTS_COPY.LIST_DESCRIPTION
      case 'accepted':
        return ADMIN_EVENTS_COPY.LIST_DESCRIPTION_ACCEPTED
      case 'rejected':
        return ADMIN_EVENTS_COPY.LIST_DESCRIPTION_REJECTED
    }
  }, [activeTab])

  if (isLoading) {
    return (
      <DashboardPage>
        <DashboardPageHeader
          title={ADMIN_EVENTS_COPY.LIST_TITLE}
          description={listDescription}
        />
        <EventListTabs activeTab={activeTab} onTabChange={handleTabChange} />
        <p className="text-sm text-muted-foreground">{ADMIN_EVENTS_COPY.LIST_LOADING}</p>
      </DashboardPage>
    )
  }

  if (isError) {
    return (
      <DashboardPage>
        <DashboardPageHeader
          title={ADMIN_EVENTS_COPY.LIST_TITLE}
          description={listDescription}
        />
        <EventListTabs activeTab={activeTab} onTabChange={handleTabChange} />
        <div className="space-y-3">
          <p className="text-sm text-destructive">
            {error?.message ?? ADMIN_EVENTS_COPY.LIST_ERROR}
          </p>
          <Button type="button" size="sm" variant="outline" onClick={() => void refetch()}>
            {ADMIN_EVENTS_COPY.LIST_RETRY}
          </Button>
        </div>
      </DashboardPage>
    )
  }

  return (
    <DashboardPage>
      <DashboardPageHeader
        title={ADMIN_EVENTS_COPY.LIST_TITLE}
        description={listDescription}
      />
      <EventListTabs activeTab={activeTab} onTabChange={handleTabChange} />
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
          isActionLoading={reviewMutation.isPending}
          loadingEventId={loadingEventId}
          showActions={showActions}
          emptyMessage={emptyMessageForTab(activeTab)}
        />
      </DashboardPageSection>
      {showActions ? (
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
      ) : null}
    </DashboardPage>
  )
}
