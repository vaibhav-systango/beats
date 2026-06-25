import type { CreateEventInput } from '@beat/types'

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
    errors.push({ field: 'title', message: 'Title is required' })
  } else if (title.length < 3) {
    errors.push({ field: 'title', message: 'Title must be at least 3 characters' })
  }

  if (!input.startAt || Number.isNaN(input.startAt)) {
    errors.push({ field: 'startAt', message: 'Start date is required' })
  } else if (input.startAt < Date.now()) {
    errors.push({ field: 'startAt', message: 'Start date must be in the future' })
  }

  return errors
}

export function getCreateEventErrorMessage(
  errors: CreateEventValidationError[]
): string {
  return errors.map((error) => error.message).join(', ')
}
