import type { UserRole } from '@beat/types'

export type DeliveryMethod = 'SMS' | 'VOICE'

export type SendOtpRequestBody = {
  countryCode: string
  phoneNumber: string
  accountType: UserRole
  deliveryMethod: DeliveryMethod
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

export type VerifyOtpRequestBody = {
  countryCode: string
  phoneNumber: string
  accountType: UserRole
  otpCode: string
}

export type VerifyOtpResponse = {
  accessToken: string
  refreshToken: string
  isNewUser: boolean
  flowType: 'LOGIN' | 'SIGNUP'
  account: {
    id: string
    name: string
    mobileNumber: string
    role: UserRole
  }
}
