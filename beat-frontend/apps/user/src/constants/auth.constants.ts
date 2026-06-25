import type { DeliveryMethod } from '@beat/api-client'

export const AUTH_CONSTANTS = {
  DEFAULT_COUNTRY_CODE: '+91',
  PHONE_LENGTH: 10,
  OTP_LENGTH: 6,
  ACCOUNT_TYPE: 'USER',
} as const

export const AUTH_VALIDATION_MESSAGES = {
  INVALID_PHONE: 'Please enter a valid 10-digit phone number',
  INVALID_OTP: 'Please enter the 6-digit code',
} as const

export const AUTH_ERROR_MESSAGES = {
  SEND_OTP_FAILED: 'Failed to send OTP',
  VERIFY_OTP_FAILED: 'Invalid OTP',
  RESEND_OTP_FAILED: 'Failed to resend OTP',
} as const

export const AUTH_COPY = {
  HERO_IMAGE_ALT: 'Concert crowd',
  HERO_IMAGE_URL:
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=2000',
  STEP_PHONE_TITLE: 'Sign in',
  STEP_OTP_TITLE: 'Enter code',
  STEP_PHONE_DESCRIPTION: 'Enter your phone number to receive an OTP',
  STEP_OTP_DESCRIPTION: (phone: string, deliveryLabel: string) =>
    `We sent a 6-digit code to ${phone} ${deliveryLabel}`,
  PHONE_LABEL: 'Phone number',
  PHONE_PLACEHOLDER: 'Enter phone number',
  DELIVERY_PROMPT: 'How would you like to receive your code?',
  CONTINUE_BUTTON: 'Continue',
  VERIFY_BUTTON: 'Verify & continue',
  CHANGE_PHONE_BUTTON: 'Change phone number',
  RESEND_CODE_BUTTON: (deliveryLabel: string) => `Resend code ${deliveryLabel}`,
  TERMS_NOTICE: 'By continuing, you agree to our Terms of Service and Privacy Policy.',
  DELIVERY_LABEL_SMS: 'via text message',
  DELIVERY_LABEL_VOICE: 'via phone call',
} as const

export const DELIVERY_OPTIONS: {
  value: DeliveryMethod
  label: string
  description: string
}[] = [
  {
    value: 'SMS',
    label: 'Text message',
    description: 'Receive a 6-digit code via SMS',
  },
  {
    value: 'VOICE',
    label: 'Phone call',
    description: 'Get your code read aloud on a call',
  },
]
