import { useCreateEventSession, useUpdateEventSession } from '@beat/api-client'
import type { Event, EventSession, LocationType, SessionLocation, UpdateSessionInput } from '@beat/types'
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

import { BasicInfoStepView } from './BasicInfoStepView'

import {
  DEFAULT_VENUE_COORDINATES,
  EVENT_EDITOR_COPY,
  LOCATION_TYPE_TO_MODE,
  TIMEZONE_OPTIONS,
} from '@/constants'
import {
  buildSessionPatchFormData,
  datetimeLocalToEpoch,
  epochToDatetimeLocal,
  hasSessionPatchPayload,
} from '@/lib/sessionFormData'
import { upsertSession } from '@/lib/sessionUpsert'
import { useEventDetailContext } from '@/router/eventDetailContext'

export interface BasicInfoStepProps {
  event: Event
  session?: EventSession
  onNext: () => void
}

function timeToDatetimeLocal(time: string, baseDate?: string): string {
  const date = baseDate || new Date().toISOString().slice(0, 10)
  return `${date}T${time}`
}

function datetimeLocalToTime(value: string): string {
  if (!value) {
    return '00:00'
  }
  return value.includes('T') ? value.split('T')[1]?.slice(0, 5) ?? '00:00' : value
}

const noop = () => {}

export function BasicInfoStep({ event, session, onNext }: BasicInfoStepProps) {
  const location = useLocation()
  const { onSessionCreated } = useEventDetailContext()
  const initialLocationType =
    (location.state as { locationType?: LocationType } | null)?.locationType ??
    'VENUE'

  const createSession = useCreateEventSession()
  const updateSession = useUpdateEventSession()

  const [title, setTitle] = useState(event.title)
  const [description, setDescription] = useState(event.description)
  const [locationType, setLocationType] = useState<LocationType>(initialLocationType)
  const [venueName, setVenueName] = useState(session?.eventAddress?.venueName ?? '')
  const [address, setAddress] = useState(
    session?.eventAddress?.formattedAddress ?? session?.eventAddress?.addressLine1 ?? ''
  )
  const [city, setCity] = useState(session?.eventAddress?.city ?? '')
  const [coordinates, setCoordinates] = useState<SessionLocation>({
    longitude: session?.location?.longitude ?? DEFAULT_VENUE_COORDINATES.longitude,
    latitude: session?.location?.latitude ?? DEFAULT_VENUE_COORDINATES.latitude,
  })
  const [startAtLocal, setStartAtLocal] = useState(
    epochToDatetimeLocal(session?.startAt)
  )
  const [endAtLocal, setEndAtLocal] = useState(epochToDatetimeLocal(session?.endAt))
  const [startTime, setStartTime] = useState(datetimeLocalToTime(epochToDatetimeLocal(session?.startAt)))
  const [endTime, setEndTime] = useState(datetimeLocalToTime(epochToDatetimeLocal(session?.endAt)))
  const [timezone, setTimezone] = useState<string>(TIMEZONE_OPTIONS[0].value)
  const [capacity, setCapacity] = useState(String(session?.capacity ?? 100))
  const [error, setError] = useState<string | null>(null)

  const isVenue = locationType === 'VENUE'
  const isOnline = locationType === 'ONLINE'

  useEffect(() => {
    setTitle(event.title)
    setDescription(event.description)
  }, [event.title, event.description])

  const resetVenueLocation = () => {
    setCoordinates({
      longitude: DEFAULT_VENUE_COORDINATES.longitude,
      latitude: DEFAULT_VENUE_COORDINATES.latitude,
    })
  }

  const buildSessionPatch = (): UpdateSessionInput => {
    const sessionPatch: UpdateSessionInput = {}

    if (title.trim()) {
      sessionPatch.title = title.trim()
    }

    const mode = LOCATION_TYPE_TO_MODE[locationType]
    if (mode) {
      sessionPatch.mode = mode
    }

    if (isOnline) {
      const today = new Date().toISOString().slice(0, 10)
      if (startTime) {
        sessionPatch.startAt = datetimeLocalToEpoch(timeToDatetimeLocal(startTime, today))
      }
      if (endTime) {
        sessionPatch.endAt = datetimeLocalToEpoch(timeToDatetimeLocal(endTime, today))
      }
    } else {
      if (startAtLocal) {
        sessionPatch.startAt = datetimeLocalToEpoch(startAtLocal)
      }
      if (endAtLocal) {
        sessionPatch.endAt = datetimeLocalToEpoch(endAtLocal)
      }
    }

    if (isVenue) {
      sessionPatch.location = coordinates

      if (venueName.trim() || address.trim() || city.trim()) {
        sessionPatch.eventAddress = {
          ...session?.eventAddress,
          ...(venueName.trim() ? { venueName: venueName.trim() } : {}),
          ...(address.trim()
            ? { formattedAddress: address.trim(), addressLine1: address.trim() }
            : {}),
          ...(city.trim() ? { city: city.trim() } : {}),
        }
      }
    } else if (isOnline && mode === 'ONLINE') {
      sessionPatch.eventAddress = {
        ...session?.eventAddress,
        formattedAddress: 'Online',
        city: 'Online',
      }
    }

    const capacityValue = Number(capacity)
    if (capacity.trim() && capacityValue > 0) {
      sessionPatch.capacity = capacityValue
    }

    return sessionPatch
  }

  const handleSaveAndNext = async () => {
    setError(null)

    const sessionPatch = buildSessionPatch()

    try {
      if (hasSessionPatchPayload(sessionPatch)) {
        const formData = buildSessionPatchFormData(sessionPatch)
        const saved = await upsertSession(event.id, session?.id, formData, {
          create: (args) => createSession.mutateAsync(args),
          update: (args) => updateSession.mutateAsync(args),
        })
        if (!session?.id) {
          onSessionCreated(saved.id)
        }
      }

      onNext()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save.')
    }
  }

  return (
    <BasicInfoStepView
      title={EVENT_EDITOR_COPY.BASIC_INFO_TITLE}
      description={EVENT_EDITOR_COPY.BASIC_INFO_DESCRIPTION}
      eventTitle={title}
      eventDescription={description}
      locationTitle={EVENT_EDITOR_COPY.LOCATION_TITLE}
      locationSubtitle={EVENT_EDITOR_COPY.LOCATION_SUBTITLE}
      locationQuestion={EVENT_EDITOR_COPY.LOCATION_QUESTION}
      locationType={locationType}
      onLocationTypeChange={setLocationType}
      isVenue={isVenue}
      isOnline={isOnline}
      venueName={venueName}
      address={address}
      city={city}
      coordinates={coordinates}
      showMapInitially={Boolean(session?.location?.latitude && session?.location?.longitude)}
      onVenueNameChange={setVenueName}
      onAddressChange={setAddress}
      onCityChange={setCity}
      onCoordinatesChange={setCoordinates}
      onResetLocation={resetVenueLocation}
      dateTimeTitle={EVENT_EDITOR_COPY.DATE_TIME_TITLE}
      startTimeLabel={EVENT_EDITOR_COPY.START_TIME_LABEL}
      endTimeLabel={EVENT_EDITOR_COPY.END_TIME_LABEL}
      timezoneLabel={EVENT_EDITOR_COPY.TIMEZONE_LABEL}
      startDatetimeLabel={EVENT_EDITOR_COPY.START_DATETIME_LABEL}
      endDatetimeLabel={EVENT_EDITOR_COPY.END_DATETIME_LABEL}
      startTime={startTime}
      endTime={endTime}
      timezone={timezone}
      timezoneOptions={TIMEZONE_OPTIONS}
      startAtLocal={startAtLocal}
      endAtLocal={endAtLocal}
      onStartTimeChange={setStartTime}
      onEndTimeChange={setEndTime}
      onTimezoneChange={setTimezone}
      onStartAtLocalChange={setStartAtLocal}
      onEndAtLocalChange={setEndAtLocal}
      capacity={capacity}
      onCapacityChange={setCapacity}
      onCapacityBlur={noop}
      onTitleChange={setTitle}
      onTitleBlur={noop}
      onDescriptionChange={setDescription}
      onDescriptionBlur={noop}
      error={error}
      isSaving={createSession.isPending || updateSession.isPending}
      nextLabel={EVENT_EDITOR_COPY.NEXT}
      onSaveAndNext={() => void handleSaveAndNext()}
    />
  )
}
