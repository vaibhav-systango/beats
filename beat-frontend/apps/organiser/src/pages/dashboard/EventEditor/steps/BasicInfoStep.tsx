import {
  useCreateEventSession,
  useUpdateEvent,
  useUpdateEventSession,
} from '@beat/api-client'
import type { Event, EventSession, LocationType, SessionMode, SessionLocation, UpdateEventInput, UpdateSessionInput } from '@beat/types'
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
  buildSessionFormData,
  buildSessionPatchFormData,
  datetimeLocalToEpoch,
  epochToDatetimeLocal,
  hasSessionPatchPayload,
} from '@/lib/sessionFormData'
import {
  validateCapacity,
  validateDatetimeRange,
  validateEventDescription,
  validateEventName,
} from '@/lib/validation'

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

export function BasicInfoStep({ event, session, onNext }: BasicInfoStepProps) {
  const location = useLocation()
  const initialLocationType =
    (location.state as { locationType?: LocationType } | null)?.locationType ??
    'VENUE'

  const updateEvent = useUpdateEvent()
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
  const [titleError, setTitleError] = useState<string | null>(null)
  const [descriptionError, setDescriptionError] = useState<string | null>(null)
  const [capacityError, setCapacityError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isSaving =
    updateEvent.isPending || createSession.isPending || updateSession.isPending
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

  const buildDraftPatch = (): {
    eventPatch: UpdateEventInput
    sessionPatch: UpdateSessionInput
  } => {
    const eventPatch: UpdateEventInput = {}
    const sessionPatch: UpdateSessionInput = {}

    if (title.trim()) {
      eventPatch.title = title.trim()
      sessionPatch.title = title.trim()
    }

    if (description.trim()) {
      eventPatch.description = description.trim()
    }

    const mode = LOCATION_TYPE_TO_MODE[locationType]
    if (mode) {
      sessionPatch.mode = mode
    }

    if (isOnline) {
      if (startTime) {
        const today = new Date().toISOString().slice(0, 10)
        sessionPatch.startAt = datetimeLocalToEpoch(timeToDatetimeLocal(startTime, today))
      }
      if (endTime) {
        const today = new Date().toISOString().slice(0, 10)
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

    return { eventPatch, sessionPatch }
  }

  const resolveDateTimesForNext = (): { startAt: number; endAt: number } | null => {
    if (isOnline) {
      const today = new Date().toISOString().slice(0, 10)
      const start = datetimeLocalToEpoch(timeToDatetimeLocal(startTime, today))
      const end = datetimeLocalToEpoch(timeToDatetimeLocal(endTime, today))
      if (!startTime) {
        setError('Start time is required.')
        return null
      }
      return { startAt: start, endAt: end || start + 3_600_000 }
    }

    if (!startAtLocal || !endAtLocal) {
      setError('Start and end date/time are required.')
      return null
    }

    return {
      startAt: datetimeLocalToEpoch(startAtLocal),
      endAt: datetimeLocalToEpoch(endAtLocal),
    }
  }

  const buildSessionInput = (startAt: number, endAt: number, mode: SessionMode) => ({
    categoryIds: session?.categoryIds ?? [],
    title: title.trim(),
    startAt,
    endAt,
    location: coordinates,
    eventAddress: {
      venueName: isVenue ? venueName.trim() : undefined,
      formattedAddress: isVenue ? address.trim() || venueName.trim() : 'Online',
      addressLine1: isVenue ? address.trim() : undefined,
      city: isVenue ? city.trim() : 'Online',
      state: isVenue ? '' : '',
      country: 'India',
      postalCode: '',
    },
    capacity: Number(capacity) || 100,
    mode,
    ticketSaleStartAt: Date.now(),
    ticketSaleEndAt: startAt,
    ticketTypes: session?.ticketTypes ?? [],
  })

  const validateForNext = (): boolean => {
    setError(null)

    const nextTitleError = validateEventName(title)
    const nextDescriptionError = validateEventDescription(description)
    const nextCapacityError = validateCapacity(capacity)

    setTitleError(nextTitleError)
    setDescriptionError(nextDescriptionError)
    setCapacityError(nextCapacityError)

    if (nextTitleError || nextDescriptionError || nextCapacityError) {
      setError(nextTitleError ?? nextDescriptionError ?? nextCapacityError)
      return false
    }

    if (isVenue) {
      if (!venueName.trim()) {
        setError(EVENT_EDITOR_COPY.VENUE_NAME_REQUIRED)
        return false
      }
      if (!city.trim()) {
        setError(EVENT_EDITOR_COPY.CITY_REQUIRED)
        return false
      }
    }

    const mode = LOCATION_TYPE_TO_MODE[locationType] as SessionMode | null
    if (!mode) {
      setError('Selected location type is not supported yet.')
      return false
    }

    if (!isOnline) {
      if (!startAtLocal || !endAtLocal) {
        setError('Start and end date/time are required.')
        return false
      }

      const datetimeRangeError = validateDatetimeRange(startAtLocal, endAtLocal)
      if (datetimeRangeError) {
        setError(datetimeRangeError)
        return false
      }
    }

    if (!resolveDateTimesForNext()) {
      return false
    }

    return true
  }

  const handleSaveDraft = async () => {
    setError(null)

    const { eventPatch, sessionPatch } = buildDraftPatch()

    try {
      if (Object.keys(eventPatch).length > 0) {
        await updateEvent.mutateAsync({
          id: event.id,
          input: eventPatch,
        })
      }

      if (session?.id && hasSessionPatchPayload(sessionPatch)) {
        const formData = buildSessionPatchFormData(sessionPatch)
        await updateSession.mutateAsync({
          eventId: event.id,
          sessionId: session.id,
          formData,
        })
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save.')
    }
  }

  const handleSaveAndNext = async () => {
    if (!validateForNext()) {
      return
    }

    const dateTimes = resolveDateTimesForNext()
    if (!dateTimes) {
      return
    }

    const { startAt, endAt } = dateTimes
    const mode = LOCATION_TYPE_TO_MODE[locationType] as SessionMode

    try {
      await updateEvent.mutateAsync({
        id: event.id,
        input: { title: title.trim(), description: description.trim() },
      })

      const formData = buildSessionFormData(buildSessionInput(startAt, endAt, mode))

      if (session?.id) {
        await updateSession.mutateAsync({
          eventId: event.id,
          sessionId: session.id,
          formData,
        })
      } else {
        await createSession.mutateAsync({ eventId: event.id, formData })
      }

      onNext()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save.')
    }
  }

  const handleTitleChange = (value: string) => {
    setTitle(value)
    if (titleError) {
      setTitleError(validateEventName(value))
    }
  }

  const handleTitleBlur = () => {
    setTitleError(validateEventName(title))
  }

  const handleDescriptionChange = (value: string) => {
    setDescription(value)
    if (descriptionError) {
      setDescriptionError(validateEventDescription(value))
    }
  }

  const handleDescriptionBlur = () => {
    setDescriptionError(validateEventDescription(description))
  }

  const handleCapacityChange = (value: string) => {
    setCapacity(value)
    if (capacityError) {
      setCapacityError(validateCapacity(value))
    }
  }

  const handleCapacityBlur = () => {
    setCapacityError(validateCapacity(capacity))
  }

  return (
    <BasicInfoStepView
      title={EVENT_EDITOR_COPY.BASIC_INFO_TITLE}
      description={EVENT_EDITOR_COPY.BASIC_INFO_DESCRIPTION}
      eventTitle={title}
      eventDescription={description}
      titleError={titleError}
      descriptionError={descriptionError}
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
      capacityError={capacityError}
      onCapacityChange={handleCapacityChange}
      onCapacityBlur={handleCapacityBlur}
      onTitleChange={handleTitleChange}
      onTitleBlur={handleTitleBlur}
      onDescriptionChange={handleDescriptionChange}
      onDescriptionBlur={handleDescriptionBlur}
      error={error}
      isSaving={isSaving}
      saveLabel={EVENT_EDITOR_COPY.SAVE}
      nextLabel={EVENT_EDITOR_COPY.NEXT}
      onSaveDraft={() => void handleSaveDraft()}
      onSaveAndNext={() => void handleSaveAndNext()}
    />
  )
}
