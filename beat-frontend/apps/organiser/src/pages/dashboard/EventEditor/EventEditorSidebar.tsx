import type { Event, EventSession } from '@beat/types'
import { formatEventDateTime } from '@beat/utils'
import { Link } from 'react-router-dom'

import {
  EVENT_EDITOR_COPY,
  EVENT_EDITOR_STEP_LABELS,
  EVENT_EDITOR_STEPS,
  type EventEditorStep,
} from '@/constants'
import { ORGANISER_PATHS } from '@/constants/routes.constants'

export interface EventEditorSidebarProps {
  event: Event
  session?: EventSession
  activeStep: EventEditorStep
  onStepChange: (step: EventEditorStep) => void
}

function isStepComplete(
  step: EventEditorStep,
  event: Event,
  session?: EventSession
): boolean {
  switch (step) {
    case 'basic-info':
      return Boolean(session?.startAt && session?.eventAddress?.city)
    case 'media':
      return Boolean(session?.eventSessionMedias?.cover)
    case 'tickets':
      return Boolean(session?.ticketTypes?.length)
    case 'publish':
      return event.status === 'PENDING_APPROVAL' || event.status === 'PUBLISHED'
    default:
      return false
  }
}

export function EventEditorSidebar({
  event,
  session,
  activeStep,
  onStepChange,
}: EventEditorSidebarProps) {
  const locationLabel =
    session?.eventAddress?.city ??
    (session?.mode === 'ONLINE' ? 'Online' : '—')

  return (
    <aside className="w-full shrink-0 lg:w-72">
      <Link
        to={ORGANISER_PATHS.EVENTS}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← {EVENT_EDITOR_COPY.BACK_TO_EVENTS}
      </Link>

      <div className="mt-4 rounded-lg border border-border bg-card p-4">
        <div className="mb-3 h-20 rounded-md bg-muted" />
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
