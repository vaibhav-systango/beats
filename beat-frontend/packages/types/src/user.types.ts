export type UserRole = 'USER' | 'ORGANIZER' | 'PROMOTER' | 'ADMIN'

export type UserOnboardingStatus = 'PROFILE_PENDING' | 'COMPLETED'

export interface User {
  id: string // ULID
  fullName: string | null
  email: string | null
  phone: string | null
}
