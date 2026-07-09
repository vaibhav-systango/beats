import type { CreateSessionInput, EventSessionMedias, UpdateSessionInput } from '@beat/types'

type SessionFormFiles = {
  cover?: File
  gallery?: File[]
  videos?: File[]
}

type SessionFormInput = UpdateSessionInput & {
  eventSessionMedias?: EventSessionMedias
}

function appendSessionFields(formData: FormData, input: SessionFormInput): void {
  if (input.categoryIds !== undefined) {
    formData.append('categoryIds', JSON.stringify(input.categoryIds))
  }
  if (input.title !== undefined) {
    formData.append('title', input.title)
  }
  if (input.startAt !== undefined) {
    formData.append('startAt', String(input.startAt))
  }
  if (input.endAt !== undefined) {
    formData.append('endAt', String(input.endAt))
  }
  if (input.location !== undefined) {
    formData.append('location', JSON.stringify(input.location))
  }
  if (input.eventAddress !== undefined) {
    formData.append('eventAddress', JSON.stringify(input.eventAddress))
  }
  if (input.capacity !== undefined) {
    formData.append('capacity', String(input.capacity))
  }
  if (input.ageRestriction !== undefined) {
    formData.append('ageRestriction', input.ageRestriction)
  }
  if (input.languages !== undefined) {
    formData.append('languages', JSON.stringify(input.languages))
  }
  if (input.mode !== undefined) {
    formData.append('mode', input.mode)
  }
  if (input.ticketSaleStartAt !== undefined) {
    formData.append('ticketSaleStartAt', String(input.ticketSaleStartAt))
  }
  if (input.ticketSaleEndAt !== undefined) {
    formData.append('ticketSaleEndAt', String(input.ticketSaleEndAt))
  }
  if (input.ticketTypes !== undefined) {
    formData.append('ticketTypes', JSON.stringify(input.ticketTypes))
  }
  if (input.eventSessionMedias !== undefined) {
    formData.append('eventSessionMedias', JSON.stringify(input.eventSessionMedias))
  }
}

function appendSessionFiles(formData: FormData, files: SessionFormFiles): void {
  if (files.cover) {
    formData.append('cover', files.cover)
  }
  files.gallery?.forEach((file) => {
    formData.append('gallery', file)
  })
  files.videos?.forEach((file) => {
    formData.append('videos', file)
  })
}

export function buildSessionPatchFormData(
  input: SessionFormInput = {},
  files: SessionFormFiles = {}
): FormData {
  const formData = new FormData()
  appendSessionFields(formData, input)
  appendSessionFiles(formData, files)
  return formData
}

export function hasSessionPatchPayload(
  input: SessionFormInput = {},
  files: SessionFormFiles = {}
): boolean {
  const hasFields = Object.values(input).some((value) => value !== undefined)
  const hasFiles = Boolean(files.cover || files.gallery?.length || files.videos?.length)
  return hasFields || hasFiles
}

export function buildSessionFormData(
  input: CreateSessionInput & { eventSessionMedias?: EventSessionMedias },
  files: SessionFormFiles = {}
): FormData {
  return buildSessionPatchFormData(input, files)
}

export function datetimeLocalToEpoch(value: string): number {
  if (!value) {
    return 0
  }
  return new Date(value).getTime()
}

export function epochToDatetimeLocal(epochMs: number | undefined): string {
  if (!epochMs) {
    return ''
  }
  const date = new Date(epochMs)
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60_000)
  return local.toISOString().slice(0, 16)
}
