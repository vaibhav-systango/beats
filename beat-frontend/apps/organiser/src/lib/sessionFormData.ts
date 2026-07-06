import type { CreateSessionInput } from '@beat/types'

type SessionFormFiles = {
  cover?: File
  gallery?: File[]
  videos?: File[]
}

export function buildSessionFormData(
  input: CreateSessionInput,
  files: SessionFormFiles = {}
): FormData {
  const formData = new FormData()

  formData.append('categoryIds', JSON.stringify(input.categoryIds))
  if (input.title) {
    formData.append('title', input.title)
  }
  formData.append('startAt', String(input.startAt))
  formData.append('endAt', String(input.endAt))
  formData.append('location', JSON.stringify(input.location))
  formData.append('eventAddress', JSON.stringify(input.eventAddress))
  formData.append('capacity', String(input.capacity))
  if (input.ageRestriction) {
    formData.append('ageRestriction', input.ageRestriction)
  }
  if (input.languages?.length) {
    formData.append('languages', JSON.stringify(input.languages))
  }
  if (input.mode) {
    formData.append('mode', input.mode)
  }
  formData.append('ticketSaleStartAt', String(input.ticketSaleStartAt))
  formData.append('ticketSaleEndAt', String(input.ticketSaleEndAt))
  formData.append('ticketTypes', JSON.stringify(input.ticketTypes))

  if (files.cover) {
    formData.append('cover', files.cover)
  }
  files.gallery?.forEach((file) => {
    formData.append('gallery', file)
  })
  files.videos?.forEach((file) => {
    formData.append('videos', file)
  })

  return formData
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

export function createDefaultTicketTypes(startAt: number) {
  const now = Date.now()
  return [
    {
      name: 'General Admission',
      price: 0,
      quantity: 100,
      saleStartAt: now,
      saleEndAt: startAt || now + 86_400_000,
    },
  ]
}
