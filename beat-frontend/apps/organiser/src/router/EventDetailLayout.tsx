import { useCreateEventSession, useEventDetails } from '@beat/api-client'
import type { EventSession } from '@beat/types'
import { Loader2 } from '@beat/ui'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Link,
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom'

import { EventDetailContext, useEventDetailContext } from './eventDetailContext'

import { EVENT_EDITOR_COPY, type EventEditorStep } from '@/constants'
import { ORGANISER_PATHS } from '@/constants/routes.constants'
import {
  DASHBOARD_EDITOR_CONTENT_PADDING,
  DASHBOARD_EDITOR_SIDEBAR_PADDING,
} from '@/lib/dashboard-layout.constants'
import { buildDuplicateSessionInput } from '@/lib/duplicateSession'
import { buildSessionFormData } from '@/lib/sessionFormData'
import { EventEditorSidebar } from '@/pages/dashboard/EventEditor/EventEditorSidebar'
import { BasicInfoStep } from '@/pages/dashboard/EventEditor/steps/BasicInfoStep'
import { MediaStep } from '@/pages/dashboard/EventEditor/steps/MediaStep'
import { PublishStep } from '@/pages/dashboard/EventEditor/steps/PublishStep'
import { TicketsStep } from '@/pages/dashboard/EventEditor/steps/TicketsStep'

function BasicInfoStepRoute() {
  const { event, session, navigateToStep } = useEventDetailContext()
  return (
    <BasicInfoStep
      key={session?.id ?? 'new-session'}
      event={event}
      session={session}
      onNext={() => navigateToStep('media')}
    />
  )
}

function MediaStepRoute() {
  const { eventId, session, navigateToStep } = useEventDetailContext()
  return (
    <MediaStep
      key={session?.id ?? 'new-session'}
      eventId={eventId}
      session={session}
      onBack={() => navigateToStep('basic-info')}
      onNext={() => navigateToStep('tickets')}
    />
  )
}

function TicketsStepRoute() {
  const { eventId, session, navigateToStep } = useEventDetailContext()
  return (
    <TicketsStep
      key={session?.id ?? 'new-session'}
      eventId={eventId}
      session={session}
      onBack={() => navigateToStep('media')}
      onNext={() => navigateToStep('publish')}
    />
  )
}

function PublishStepRoute() {
  const { event, session, navigateToStep } = useEventDetailContext()
  return (
    <PublishStep
      key={session?.id ?? 'new-session'}
      event={event}
      session={session}
      onBack={() => navigateToStep('tickets')}
    />
  )
}

export function EventDetailLayout() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeSessionId = searchParams.get('sessionId')

  const { data: event, isLoading, error } = useEventDetails(id)
  const createSession = useCreateEventSession()
  const [duplicateError, setDuplicateError] = useState<string | null>(null)

  const sessions = event?.sessions ?? []

  const session = useMemo((): EventSession | undefined => {
    if (!sessions.length) {
      return undefined
    }
    if (activeSessionId) {
      return sessions.find((item) => item.id === activeSessionId) ?? sessions[0]
    }
    return sessions[0]
  }, [sessions, activeSessionId])

  useEffect(() => {
    if (!sessions.length) {
      return
    }

    const isValidSession =
      activeSessionId && sessions.some((item) => item.id === activeSessionId)

    if (!isValidSession) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.set('sessionId', sessions[0].id)
          return next
        },
        { replace: true }
      )
    }
  }, [sessions, activeSessionId, setSearchParams])

  const navigateToStep = useCallback(
    (step: EventEditorStep) => {
      if (!id) {
        return
      }
      navigate(
        ORGANISER_PATHS.eventStep(id, step, {
          sessionId: session?.id,
        })
      )
    },
    [id, navigate, session?.id]
  )

  const handleSessionChange = (sessionId: string) => {
    if (sessionId === session?.id) {
      return
    }

    const confirmed = window.confirm(
      'Switch session? Unsaved changes on this step will be lost.'
    )
    if (!confirmed) {
      return
    }

    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('sessionId', sessionId)
        return next
      },
      { replace: false }
    )
  }

  const handleDuplicateSession = async () => {
    if (!session || !id) {
      return
    }

    setDuplicateError(null)

    try {
      const input = buildDuplicateSessionInput(session)
      const formData = buildSessionFormData(input)
      const created = await createSession.mutateAsync({ eventId: id, formData })
      navigate(
        ORGANISER_PATHS.eventStep(id, 'basic-info', { sessionId: created.id })
      )
    } catch (duplicateSessionError) {
      setDuplicateError(
        duplicateSessionError instanceof Error
          ? duplicateSessionError.message
          : 'Failed to duplicate session.'
      )
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !event || !id) {
    return (
      <div className="space-y-4 p-4 md:p-6 lg:p-8">
        <p className="text-red-500" role="alert">
          {error?.message ?? 'Event not found.'}
        </p>
        <Link to={ORGANISER_PATHS.EVENTS} className="text-primary hover:underline">
          {EVENT_EDITOR_COPY.BACK_TO_EVENTS}
        </Link>
      </div>
    )
  }

  const contextValue = {
    event,
    eventId: id,
    sessions,
    session,
    sessionId: session?.id,
    navigateToStep,
  }

  return (
    <EventDetailContext.Provider value={contextValue}>
      <div className="flex w-full min-w-0 flex-col lg:min-h-0 lg:flex-1 lg:flex-row lg:overflow-hidden">
        <div className="sticky top-0 z-10 shrink-0 bg-background md:static md:flex md:h-full md:w-64 md:shrink-0 md:flex-col md:overflow-y-auto md:border-r md:border-border/40">
          <div className={DASHBOARD_EDITOR_SIDEBAR_PADDING}>
            <EventEditorSidebar
              event={event}
              eventId={id}
              sessions={sessions}
              session={session}
              activeSessionId={session?.id}
              isDuplicating={createSession.isPending}
              duplicateError={duplicateError}
              onSessionChange={handleSessionChange}
              onDuplicateSession={() => void handleDuplicateSession()}
            />
          </div>
        </div>

        <div className="min-h-0 min-w-0 flex-1 lg:overflow-y-auto lg:overflow-x-hidden">
          <div className={DASHBOARD_EDITOR_CONTENT_PADDING}>
            <Routes>
              <Route index element={<Navigate to="basic-info" replace />} />
              <Route path="basic-info" element={<BasicInfoStepRoute />} />
              <Route path="media" element={<MediaStepRoute />} />
              <Route path="tickets" element={<TicketsStepRoute />} />
              <Route path="publish" element={<PublishStepRoute />} />
              <Route
                path="*"
                element={
                  <Navigate
                    to={ORGANISER_PATHS.eventStep(id, 'basic-info', {
                      sessionId: session?.id,
                    })}
                    replace
                  />
                }
              />
            </Routes>
          </div>
        </div>
      </div>
    </EventDetailContext.Provider>
  )
}
