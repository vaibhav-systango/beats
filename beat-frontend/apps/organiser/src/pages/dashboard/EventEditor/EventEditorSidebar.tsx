import { SignedMediaImage } from '@beat/api-client'
import type { Event, EventSession } from '@beat/types'
import { Button, Loader2 } from '@beat/ui'
import { formatEventDateTime } from '@beat/utils'
import { Link, NavLink, useParams } from 'react-router-dom'

import {
  EVENT_EDITOR_COPY,
  EVENT_EDITOR_STEP_LABELS,
  EVENT_EDITOR_STEPS,
  type EventEditorStep,
} from '@/constants'
import { ORGANISER_PATHS } from '@/constants/routes.constants'
import {
  isBasicInfoComplete,
  isMediaComplete,
  isTicketsComplete,
} from '@/lib/eventEditorProgress'
import { formatSessionLabel } from '@/lib/sessionLabel'

export interface EventEditorSidebarProps {
  event: Event
  eventId: string
  sessions: EventSession[]
  session?: EventSession
  activeSessionId?: string
  canManageSessions: boolean
  onSessionChange: (sessionId: string) => void
  onAddSession: () => void
  onDuplicateSession: () => void
  onDeleteSession: (sessionId: string) => void
  isCreatingSession?: boolean
  isDeletingSession?: boolean
  sessionActionError?: string | null
}

function parseActiveStep(splat: string | undefined): EventEditorStep {
  const segment = splat?.split('/')[0]
  if (segment && EVENT_EDITOR_STEPS.includes(segment as EventEditorStep)) {
    return segment as EventEditorStep
  }
  return 'basic-info'
}

function isStepComplete(
  step: EventEditorStep,
  event: Event,
  session?: EventSession
): boolean {
  switch (step) {
    case 'basic-info':
      return isBasicInfoComplete(event, session)
    case 'media':
      return isMediaComplete(session)
    case 'tickets':
      return isTicketsComplete(session)
    case 'publish':
      return event.status === 'PENDING_APPROVAL' || event.status === 'PUBLISHED'
    default:
      return false
  }
}

export function EventEditorSidebar({
  event,
  eventId,
  sessions,
  session,
  activeSessionId,
  canManageSessions,
  onSessionChange,
  onAddSession,
  onDuplicateSession,
  onDeleteSession,
  isCreatingSession = false,
  isDeletingSession = false,
  sessionActionError,
}: EventEditorSidebarProps) {
  const { '*': splat } = useParams()
  const activeStep = parseActiveStep(splat)
  const locationLabel =
    session?.eventAddress?.city ??
    (session?.mode === 'ONLINE' ? 'Online' : '—')
  const isSessionBusy = isCreatingSession || isDeletingSession

  return (
    <aside className="w-full min-w-0 shrink-0 lg:w-full">
      <Link
        to={ORGANISER_PATHS.EVENTS}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← {EVENT_EDITOR_COPY.BACK_TO_EVENTS}
      </Link>

      <div className="mt-4 rounded-lg border border-border bg-card p-4">
        {session?.eventSessionMedias?.cover?.url ? (
          <SignedMediaImage
            src={session.eventSessionMedias.cover.url}
            alt=""
            className="mb-3 h-20 w-full rounded-md object-cover"
          />
        ) : (
          <div className="mb-3 h-20 rounded-md bg-muted" />
        )}
        {session?.startAt ? (
          <p className="text-xs font-medium uppercase text-muted-foreground">
            {formatEventDateTime(session.startAt)}
          </p>
        ) : null}
        <p className="mt-1 font-semibold leading-snug">{event.title}</p>
        <p className="text-sm text-muted-foreground">{locationLabel}</p>
        <span className="mt-2 inline-block rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
          {EVENT_EDITOR_COPY.DRAFT}
        </span>
      </div>

      <div className="mt-6 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {EVENT_EDITOR_COPY.SESSIONS_TITLE}
        </p>

        {sessions.length > 0 ? (
          <ul className="space-y-1" aria-label="Event sessions">
            {sessions.map((item, index) => {
              const isActive = item.id === activeSessionId
              return (
                <li key={item.id} className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onSessionChange(item.id)}
                    className={`min-w-0 flex-1 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                      isActive
                        ? 'bg-muted font-medium text-foreground'
                        : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                    }`}
                    aria-current={isActive ? 'true' : undefined}
                  >
                    {formatSessionLabel(item, index)}
                  </button>
                  {isActive && canManageSessions ? (
                    <button
                      type="button"
                      onClick={() => onDeleteSession(item.id)}
                      disabled={isSessionBusy}
                      className="rounded-md px-2 py-2 text-xs text-red-500 hover:bg-red-50 disabled:opacity-50"
                      aria-label={EVENT_EDITOR_COPY.DELETE_SESSION}
                    >
                      ×
                    </button>
                  ) : null}
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No sessions yet.</p>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full"
          disabled={!canManageSessions || isSessionBusy}
          onClick={onAddSession}
        >
          {isCreatingSession ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            EVENT_EDITOR_COPY.ADD_SESSION
          )}
        </Button>

        {session && sessions.length > 0 ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            disabled={!canManageSessions || isSessionBusy}
            onClick={onDuplicateSession}
          >
            {isCreatingSession ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              EVENT_EDITOR_COPY.DUPLICATE_SESSION
            )}
          </Button>
        ) : null}

        {sessionActionError ? (
          <p className="text-xs text-red-500" role="alert">
            {sessionActionError}
          </p>
        ) : null}
      </div>

      <nav className="mt-6 space-y-1" aria-label="Event editor steps">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Edit event
        </p>
        {EVENT_EDITOR_STEPS.map((step) => {
          const isActive = step === activeStep
          const isComplete = isStepComplete(step, event, session)
          const stepPath = ORGANISER_PATHS.eventStep(eventId, step, {
            sessionId: activeSessionId,
          })

          return (
            <NavLink
              key={step}
              to={stepPath}
              className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                isActive ? 'bg-muted font-medium' : 'hover:bg-muted/60'
              }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full border text-xs ${
                  isComplete
                    ? 'border-green-500 bg-green-500 text-white'
                    : 'border-muted-foreground/40'
                }`}
              >
                {isComplete ? '✓' : ''}
              </span>
              {EVENT_EDITOR_STEP_LABELS[step]}
              {!isComplete && !isActive ? (
                <span className="ml-auto h-2 w-2 rounded-full bg-red-400" />
              ) : null}
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}
