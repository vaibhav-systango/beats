export const AUTH_DEFAULTS = {
  DEFAULT_COUNTRY_CODE: '+91',
  PHONE_LENGTH: 10,
  OTP_LENGTH: 6,
} as const

export const ONBOARDING_CITIES = [
  'Mumbai',
  'Delhi',
  'Bangalore',
  'Hyderabad',
  'Chennai',
  'Kolkata',
  'Pune',
  'Ahmedabad',
  'Jaipur',
  'Chandigarh',
  'Lucknow',
  'Kochi',
  'Goa',
  'Indore',
  'Bhopal',
  'Nagpur',
  'Surat',
  'Vadodara',
  'Coimbatore',
  'Visakhapatnam',
  'Guwahati',
  'Bhubaneswar',
  'Dehradun',
  'Noida',
  'Gurgaon',
] as const

export type OnboardingCity = (typeof ONBOARDING_CITIES)[number]

export const ONBOARDING_CITY_COORDINATES: Record<
  OnboardingCity,
  { latitude: number; longitude: number }
> = {
  Mumbai: { latitude: 19.076, longitude: 72.877 },
  Delhi: { latitude: 28.704, longitude: 77.102 },
  Bangalore: { latitude: 12.971, longitude: 77.594 },
  Hyderabad: { latitude: 17.385, longitude: 78.487 },
  Chennai: { latitude: 13.083, longitude: 80.27 },
  Kolkata: { latitude: 22.573, longitude: 88.364 },
  Pune: { latitude: 18.52, longitude: 73.856 },
  Ahmedabad: { latitude: 23.023, longitude: 72.571 },
  Jaipur: { latitude: 26.912, longitude: 75.787 },
  Chandigarh: { latitude: 30.733, longitude: 76.779 },
  Lucknow: { latitude: 26.847, longitude: 80.947 },
  Kochi: { latitude: 9.931, longitude: 76.267 },
  Goa: { latitude: 15.299, longitude: 74.124 },
  Indore: { latitude: 22.719, longitude: 75.857 },
  Bhopal: { latitude: 23.26, longitude: 77.413 },
  Nagpur: { latitude: 21.146, longitude: 79.088 },
  Surat: { latitude: 21.17, longitude: 72.831 },
  Vadodara: { latitude: 22.307, longitude: 73.181 },
  Coimbatore: { latitude: 11.016, longitude: 76.956 },
  Visakhapatnam: { latitude: 17.687, longitude: 83.219 },
  Guwahati: { latitude: 26.144, longitude: 91.736 },
  Bhubaneswar: { latitude: 20.296, longitude: 85.825 },
  Dehradun: { latitude: 30.317, longitude: 78.032 },
  Noida: { latitude: 28.535, longitude: 77.391 },
  Gurgaon: { latitude: 28.459, longitude: 77.026 },
}

export const ONBOARDING_VALIDATION = {
  MIN_CATEGORIES: 2,
} as const
