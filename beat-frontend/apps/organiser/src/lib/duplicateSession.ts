import type {
  CreateSessionInput,
  EventSession,
  EventSessionMedias,
  SessionTicketType,
} from '@beat/types'

export type DuplicateSessionInput = CreateSessionInput & {
  eventSessionMedias?: EventSessionMedias
}

function cloneTicketTypes(ticketTypes: SessionTicketType[] = []): SessionTicketType[] {
  return ticketTypes.map(
    ({ name, description, price, quantity, maxPurchaseLimit, saleStartAt, saleEndAt }) => ({
      name,
      description,
      price,
      quantity,
      maxPurchaseLimit,
      saleStartAt,
      saleEndAt,
    })
  )
}

function cloneEventSessionMedias(
  medias?: EventSessionMedias
): EventSessionMedias | undefined {
  if (!medias) {
    return undefined
  }

  return JSON.parse(JSON.stringify(medias)) as EventSessionMedias
}

export function buildDuplicateSessionInput(source: EventSession): DuplicateSessionInput {
  return {
    categoryIds: source.categoryIds ?? [],
    title: source.title,
    startAt: source.startAt,
    endAt: source.endAt,
    location: source.location,
    eventAddress: source.eventAddress,
    capacity: source.capacity,
    ageRestriction: source.ageRestriction,
    languages: source.languages,
    mode: source.mode,
    ticketSaleStartAt: source.ticketSaleStartAt,
    ticketSaleEndAt: source.ticketSaleEndAt,
    ticketTypes: cloneTicketTypes(source.ticketTypes),
    eventSessionMedias: cloneEventSessionMedias(source.eventSessionMedias),
  }
}
