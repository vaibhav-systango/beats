export type OnboardingLocation = {
  latitude: number
  longitude: number
}

export type OnboardUserRequestBody = {
  fullName: string
  email?: string
  profileImage?: string
  location?: OnboardingLocation
  categoryIds: string[]
}

export type OnboardUserResponse = {
  message: string
}
