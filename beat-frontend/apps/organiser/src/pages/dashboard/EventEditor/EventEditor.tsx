import { useEventDetails } from '@beat/api-client'
import { Loader2 } from '@beat/ui'
import { useMemo } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'

import {
  EVENT_EDITOR_COPY,
  EVENT_EDITOR_STEPS,
  type EventEditorStep,
} from '@/constants'
import { ORGANISER_PATHS } from '@/constants/routes.constants'

import { EventEditorSidebar } from './EventEditorSidebar'
import { BasicInfoStep } from './steps/BasicInfoStep'
import { MediaStep } from './steps/MediaStep'
import { PublishStep } from './steps/PublishStep'
import { TicketsStep } from './steps/TicketsStep'

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

  const { data: event, isLoading, error } = useEventDetails(id)

  const session = useMemo(() => event?.sessions?.[0], [event?.sessions])

  const goToStep = (step: EventEditorStep) => {
    setSearchParams({ step })
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
    <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
      <EventEditorSidebar
        event={event}
        session={session}
        activeStep={activeStep}
        onStepChange={goToStep}
      />

      <div className="min-w-0 flex-1">
        {activeStep === 'basic-info' && (
          <BasicInfoStep
            event={event}
            session={session}
            onNext={() => goToStep('media')}
          />
        )}
        {activeStep === 'media' && (
          <MediaStep
            eventId={id}
            session={session}
            onBack={() => goToStep('basic-info')}
            onNext={() => goToStep('tickets')}
          />
        )}
        {activeStep === 'tickets' && (
          <TicketsStep
            eventId={id}
            session={session}
            onBack={() => goToStep('media')}
            onNext={() => goToStep('publish')}
          />
        )}
        {activeStep === 'publish' && (
          <PublishStep
            event={event}
            session={session}
            onBack={() => goToStep('tickets')}
          />
        )}
      </div>
    </div>
  )
}
