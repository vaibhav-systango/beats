import type { CreateEventInput } from '@beat/types'

import { EVENT_VALIDATION_MESSAGES } from '../constants/validation.constants'

export type CreateEventValidationError = {
  field: keyof CreateEventInput | 'form'
  message: string
}

export function validateCreateEventInput(
  input: CreateEventInput
): CreateEventValidationError[] {
  const errors: CreateEventValidationError[] = []

  const title = input.title?.trim() ?? ''
  if (!title) {
    errors.push({ field: 'title', message: EVENT_VALIDATION_MESSAGES.TITLE_REQUIRED })
  } else if (title.length < 3) {
    errors.push({ field: 'title', message: EVENT_VALIDATION_MESSAGES.TITLE_MIN_LENGTH })
  }

  if (!input.startAt || Number.isNaN(input.startAt)) {
    errors.push({ field: 'startAt', message: EVENT_VALIDATION_MESSAGES.START_DATE_REQUIRED })
  } else if (input.startAt < Date.now()) {
    errors.push({ field: 'startAt', message: EVENT_VALIDATION_MESSAGES.START_DATE_FUTURE })
  }

  return errors
}

export function getCreateEventErrorMessage(
  errors: CreateEventValidationError[]
): string {
  return errors.map((error) => error.message).join(', ')
}
