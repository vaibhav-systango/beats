export const AUTH_DEFAULTS = {
  DEFAULT_COUNTRY_CODE: '+91',
  PHONE_LENGTH: 10,
  OTP_LENGTH: 6,
} as const

export const ONBOARDING_CITIES = [
  'Mumbai',
  'Delhi',
  'Bangalore',
  'Pune',
  'Goa',
] as const

export type OnboardingCity = (typeof ONBOARDING_CITIES)[number]

export const ONBOARDING_CITY_COORDINATES: Record<
  OnboardingCity,
  { latitude: number; longitude: number }
> = {
  Mumbai: { latitude: 19.076, longitude: 72.877 },
  Delhi: { latitude: 28.704, longitude: 77.102 },
  Bangalore: { latitude: 12.971, longitude: 77.594 },
  Pune: { latitude: 18.52, longitude: 73.856 },
  Goa: { latitude: 15.299, longitude: 74.124 },
}

export const ONBOARDING_VALIDATION = {
  MIN_CATEGORIES: 2,
} as const
