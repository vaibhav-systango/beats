import { useCreateEventSession, useEventDetails } from '@beat/api-client'
import { Loader2 } from '@beat/ui'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'


import { EventEditorSidebar } from './EventEditorSidebar'
import { BasicInfoStep } from './steps/BasicInfoStep'
import { MediaStep } from './steps/MediaStep'
import { PublishStep } from './steps/PublishStep'
import { TicketsStep } from './steps/TicketsStep'

import {
  EVENT_EDITOR_COPY,
  EVENT_EDITOR_STEPS,
  type EventEditorStep,
} from '@/constants'
import { ORGANISER_PATHS } from '@/constants/routes.constants'
import {
  DASHBOARD_EDITOR_CONTENT_PADDING,
  DASHBOARD_EDITOR_SIDEBAR_PADDING,
} from '@/lib/dashboard-layout.constants'
import { buildDuplicateSessionInput } from '@/lib/duplicateSession'
import { buildSessionFormData } from '@/lib/sessionFormData'

function parseStep(step: string | null): EventEditorStep {
  if (step && EVENT_EDITOR_STEPS.includes(step as EventEditorStep)) {
    return step as EventEditorStep
  }
  return 'basic-info'
}

export function EventEditor() {
  const { id } = useParams<{ id: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeStep = parseStep(searchParams.get('step'))
  const activeSessionId = searchParams.get('sessionId')

  const { data: event, isLoading, error } = useEventDetails(id)
  const createSession = useCreateEventSession()
  const [duplicateError, setDuplicateError] = useState<string | null>(null)

  const sessions = event?.sessions ?? []

  const session = useMemo(() => {
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

  const updateSearchParams = (updates: Record<string, string>) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      Object.entries(updates).forEach(([key, value]) => {
        next.set(key, value)
      })
      return next
    })
  }

  const goToStep = (step: EventEditorStep) => {
    updateSearchParams({ step })
  }

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

    updateSearchParams({ sessionId })
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
      updateSearchParams({ sessionId: created.id, step: 'basic-info' })
    } catch (duplicateSessionError) {
      setDuplicateError(
        duplicateSessionError instanceof Error
          ? duplicateSessionError.message
          : 'Failed to duplicate session.'
      )
    }
  }

  const sessionKey = session?.id ?? 'new-session'

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !event || !id) {
    return (
      <div className="space-y-4">
        <p className="text-red-500" role="alert">
          {error?.message ?? 'Event not found.'}
        </p>
        <Link to={ORGANISER_PATHS.EVENTS} className="text-primary hover:underline">
          {EVENT_EDITOR_COPY.BACK_TO_EVENTS}
        </Link>
      </div>
    )
  }

  return (
    <div className="flex w-full min-w-0 flex-col lg:min-h-0 lg:flex-1 lg:flex-row lg:overflow-hidden">
      <div className="sticky top-0 z-10 shrink-0 bg-background lg:static lg:w-72 lg:overflow-y-auto lg:border-r lg:border-border/40">
        <div className={DASHBOARD_EDITOR_SIDEBAR_PADDING}>
          <EventEditorSidebar
            event={event}
            sessions={sessions}
            session={session}
            activeSessionId={session?.id}
            activeStep={activeStep}
            isDuplicating={createSession.isPending}
            duplicateError={duplicateError}
            onStepChange={goToStep}
            onSessionChange={handleSessionChange}
            onDuplicateSession={() => void handleDuplicateSession()}
          />
        </div>
      </div>

      <div className="min-h-0 min-w-0 flex-1 lg:overflow-y-auto lg:overflow-x-hidden">
        <div className={DASHBOARD_EDITOR_CONTENT_PADDING}>
          {activeStep === 'basic-info' && (
          <BasicInfoStep
            key={sessionKey}
            event={event}
            session={session}
            onNext={() => goToStep('media')}
          />
        )}
        {activeStep === 'media' && (
          <MediaStep
            key={sessionKey}
            eventId={id}
            session={session}
            onBack={() => goToStep('basic-info')}
            onNext={() => goToStep('tickets')}
          />
        )}
        {activeStep === 'tickets' && (
          <TicketsStep
            key={sessionKey}
            eventId={id}
            session={session}
            onBack={() => goToStep('media')}
            onNext={() => goToStep('publish')}
          />
        )}
        {activeStep === 'publish' && (
          <PublishStep
            key={sessionKey}
            event={event}
            session={session}
            onBack={() => goToStep('tickets')}
          />
        )}
        </div>
      </div>
    </div>
  )
}
