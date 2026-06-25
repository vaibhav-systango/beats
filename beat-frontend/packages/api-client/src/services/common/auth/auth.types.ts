import type { UserRole } from '@beat/types'

export type SendOtpRequestBody = {
  countryCode: string
  phoneNumber: string
  accountType: UserRole
}

export type SendOtpResponse = {
  message: string
  otp?: string
}

export type SendOtpEnvelope = {
  statusCode?: number
  success?: boolean
  message: string
  otp?: string
}
