import type { LocationType, SessionMode } from '@beat/types'

export const EVENT_EDITOR_STEPS = [
  'basic-info',
  'media',
  'tickets',
  'publish',
] as const

export type EventEditorStep = (typeof EVENT_EDITOR_STEPS)[number]

export const EVENT_EDITOR_STEP_LABELS: Record<EventEditorStep, string> = {
  'basic-info': 'Basic Info',
  media: 'Media',
  tickets: 'Tickets',
  publish: 'Publish',
}

export const EVENT_CREATE_COPY = {
  TITLE: 'Create an event',
  EVENT_NAME_LABEL: 'Event Name *',
  EVENT_NAME_PLACEHOLDER: 'Enter the name of your event',
  DESCRIPTION_LABEL: 'Event Description *',
  DESCRIPTION_PLACEHOLDER: 'Tell people what your event is about',
  SLUG_LABEL: 'Event slug',
  SLUG_PLACEHOLDER: 'futurex-tech-summit-2026',
  SLUG_HELP: 'Used in your event URL. Auto-generated from the name; you can edit it.',
  LOCATION_TITLE: 'Location',
  LOCATION_SUBTITLE: 'Choose where your event will take place.',
  LOCATION_QUESTION: 'Where will your event take place?',
  SUBMIT_LABEL: 'Create & Continue',
  SUBMITTING_LABEL: 'Creating…',
  DESCRIPTION_REQUIRED: 'Event description is required.',
} as const

export const LOCATION_TYPE_OPTIONS: Array<{
  id: LocationType
  label: string
  description: string
  disabled?: boolean
}> = [
  {
    id: 'VENUE',
    label: 'Venue',
    description: 'Host in-person events with check-in management.',
  },
  {
    id: 'ONLINE',
    label: 'Online',
    description: 'Host virtual events, sharing access with ticket buyers.',
  },
  {
    id: 'RECORDED',
    label: 'Recorded events',
    description: 'Provide instant access to pre-recorded content after purchase.',
    disabled: true,
  },
]

export const TIMEZONE_OPTIONS = [
  { value: 'Asia/Kolkata', label: 'GMT+05:30' },
  { value: 'UTC', label: 'GMT+00:00' },
  { value: 'America/New_York', label: 'GMT-05:00' },
  { value: 'Europe/London', label: 'GMT+00:00 (London)' },
] as const

export const DEFAULT_VENUE_COORDINATES = {
  longitude: 72.8777,
  latitude: 19.076,
} as const

export const LOCATION_TYPE_TO_MODE: Record<LocationType, SessionMode | null> = {
  VENUE: 'OFFLINE',
  ONLINE: 'ONLINE',
  RECORDED: null,
}

export const EVENT_EDITOR_COPY = {
  BACK_TO_EVENTS: 'Back to events',
  PREVIEW: 'Preview',
  DRAFT: 'Draft',
  NEXT: 'Save & Next',
  BACK: 'Back',
  SAVE: 'Save',
  SAVING: 'Saving…',
  BASIC_INFO_TITLE: 'Basic info',
  BASIC_INFO_DESCRIPTION:
    'Name your event and tell event-goers why they should come. Add details that highlight what makes it unique.',
  LOCATION_TITLE: 'Location',
  LOCATION_SUBTITLE: 'Choose where your event will take place.',
  LOCATION_QUESTION: 'Where will your event take place?',
  DATE_TIME_TITLE: 'Date and time',
  START_TIME_LABEL: 'Start time *',
  END_TIME_LABEL: 'End time',
  TIMEZONE_LABEL: 'Time Zone *',
  START_DATETIME_LABEL: 'Start date & time *',
  END_DATETIME_LABEL: 'End date & time *',
  VENUE_NAME_REQUIRED: 'Location name is required for venue events.',
  CITY_REQUIRED: 'City is required for venue events.',
  MEDIA_TITLE: 'Media',
  MEDIA_DESCRIPTION: 'Upload banners and gallery media for your event.',
  TICKETS_TITLE: 'Tickets',
  TICKETS_DESCRIPTION:
    'Increase visibility and drive higher conversions by selling directly on Beat.',
  PUBLISH_TITLE: 'Your event is almost ready to publish',
  PUBLISH_DESCRIPTION:
    'Review your settings and let everyone find your event.',
  SAVE_DRAFT: 'Save as draft',
  PUBLISH: 'Publish',
  PUBLISHING: 'Publishing…',
  ADD_TICKETS: '+ Add tickets',
  SETUP_TICKETING: 'Set up ticketing',
  SETUP_TICKETING_DESCRIPTION:
    'Create paid tickets, free entries and custom donation entries',
} as const
