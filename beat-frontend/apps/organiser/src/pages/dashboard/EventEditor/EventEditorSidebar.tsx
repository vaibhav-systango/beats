import type { Event, EventSession } from '@beat/types'
import { Button, Loader2 } from '@beat/ui'
import { formatEventDateTime } from '@beat/utils'
import { Link } from 'react-router-dom'

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
  sessions: EventSession[]
  session?: EventSession
  activeSessionId?: string
  activeStep: EventEditorStep
  onStepChange: (step: EventEditorStep) => void
  onSessionChange: (sessionId: string) => void
  onDuplicateSession: () => void
  isDuplicating?: boolean
  duplicateError?: string | null
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
  sessions,
  session,
  activeSessionId,
  activeStep,
  onStepChange,
  onSessionChange,
  onDuplicateSession,
  isDuplicating = false,
  duplicateError,
}: EventEditorSidebarProps) {
  const locationLabel =
    session?.eventAddress?.city ??
    (session?.mode === 'ONLINE' ? 'Online' : '—')

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
          <img
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

      {sessions.length > 0 ? (
        <div className="mt-6 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {EVENT_EDITOR_COPY.SESSIONS_TITLE}
          </p>
          <ul className="space-y-1" aria-label="Event sessions">
            {sessions.map((item, index) => {
              const isActive = item.id === activeSessionId
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onSessionChange(item.id)}
                    className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                      isActive
                        ? 'bg-muted font-medium text-foreground'
                        : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                    }`}
                    aria-current={isActive ? 'true' : undefined}
                  >
                    {formatSessionLabel(item, index)}
                  </button>
                </li>
              )
            })}
          </ul>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            disabled={!session || isDuplicating}
            onClick={onDuplicateSession}
          >
            {isDuplicating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              EVENT_EDITOR_COPY.DUPLICATE_SESSION
            )}
          </Button>
          {duplicateError ? (
            <p className="text-xs text-red-500" role="alert">
              {duplicateError}
            </p>
          ) : null}
        </div>
      ) : null}

      <nav className="mt-6 space-y-1" aria-label="Event editor steps">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Edit event
        </p>
        {EVENT_EDITOR_STEPS.map((step) => {
          const isActive = step === activeStep
          const isComplete = isStepComplete(step, event, session)

          return (
            <button
              key={step}
              type="button"
              onClick={() => onStepChange(step)}
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
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
