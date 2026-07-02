export const EventMessages = {
  NOT_FOUND: 'Event not found.',
  LOCKED: 'This event is locked for changes as it is currently pending administrative review.',
  FORBIDDEN_UPDATE: 'You are not authorized to update this event.',
  FORBIDDEN_DELETE: 'You are not authorized to delete this event.',
  FORBIDDEN_VIEW: 'You are not authorized to view these events.',
  CATEGORY_NOT_FOUND: 'Event Category not found.',
  UNEXPECTED_ERROR: 'An unexpected error occurred. Please try again later.',
  DELETED: 'Event deleted successfully.',
  CANCELLED: 'Event and all associated sessions cancelled successfully.',
  MANDATORY_CANCEL_REASON: 'A reason is required for emergency cancellation.',
  MANDATORY_REJECT_REASON: 'A reason is mandatory for rejection.',
  INVALID_SESSION: 'Staged Session ID is invalid or has been deleted.',
  INVALID_TICKET: 'Staged Ticket ID is invalid or belongs to another session.',
  NOT_PENDING: 'Only events in PENDING_APPROVAL status can be reviewed.',
  CHECKOUT_SUCCESS: 'Ticket checkout successful! Order processed.',

  // Validation Guardrails
  SESSION_REQUIRED: 'At least one event session is required.',
  TEMPORAL_INVALID_SALE_WINDOW: 'Session ticketSaleStartAt must be strictly before ticketSaleEndAt.',
  TEMPORAL_INVALID_SALE_END: 'Session ticketSaleEndAt must be before or equal to startAt.',
  TEMPORAL_INVALID_SESSION_WINDOW: 'Session startAt must be strictly before endAt.',
  PRICING_TIER_REQUIRED: 'At least one pricing tier (ticket type) is required for approval.',
  CAPACITY_EXCEEDED: 'Sum of all ticket type quantities exceeds the parent session capacity constraint.',
  REFERRAL_REWARD_INVALID: 'Session referralRewardPerTicket must be positive when allowReferral is enabled.',
  PROMOTER_COMMISSION_INVALID: 'Session promoterCommissionPercentage must be a positive number <= 100.00 when allowPromoters is enabled.',
  COVER_ASSET_MANDATORY: 'Session cover image (banner asset) is mandatory for submission.',

  // Controller Roles
  ORGANIZER_ONLY_CREATE: 'Only organizer accounts can create events.',
  ORGANIZER_ONLY_UPDATE: 'Only organizer accounts can update events.',
  ORGANIZER_ONLY_DELETE: 'Only organizer accounts can delete events.',
  ORGANIZER_ONLY_VIEW: 'Only organizer accounts can view their events.',
  ADMIN_ONLY_REVIEW: 'Only admin accounts can review events.',
  ADMIN_ONLY_CANCEL: 'Only admin accounts can cancel events.',

  // Checkout Validations
  CHECKOUT_INVALID_INPUT: 'Invalid ticketTypeId or quantity.',
  TICKET_NOT_FOUND: 'Ticket type not found or is inactive.',
  SESSION_NOT_FOUND: 'Event session not found or is deleted.',
  SESSION_CANCELLED: 'This event session has been cancelled. Checkout rejected.',
  SESSION_COMPLETED: 'This event session has already completed.',
  EVENT_CANCELLED: 'This event has been cancelled by administrative action. Ticket sales are closed.',
  EVENT_NOT_PUBLISHED: 'This event is not published. Bookings are only open for PUBLISHED shows.',
  SESSION_SALES_CLOSED: 'Ticket sales for this session have either not started or are closed.',
  TICKET_SALES_CLOSED: 'This specific ticket type is not currently active for purchase.',
  INSUFFICIENT_INVENTORY: 'Insufficient ticket capacity remaining.',
};

export const EventConstants = {
  DISCOVERY_CACHE_TTL_MS: 30000,
  DETAILS_CACHE_TTL_MS: 10000,
  CHECKOUT_LIMIT: 10,
  CHECKOUT_TTL_MS: 60000,
  CREATION_LIMIT: 20,
  CREATION_TTL_MS: 60000,
  DISCOVERY_LIMIT: 100,
  DISCOVERY_TTL_MS: 60000,
};
