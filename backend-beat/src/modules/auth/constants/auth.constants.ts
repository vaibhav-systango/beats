export const AuthMessages = {
  OTP_SENT: 'OTP generated and sent successfully.',
  OTP_RESENT: 'OTP re-sent successfully.',
  OTP_THROTTLED: 'Please wait before requesting a new OTP.',
  TOO_MANY_ATTEMPTS:
    'Maximum OTP request attempts reached. Please try again later.',
  TOO_MANY_GUESSES:
    'Maximum OTP verification attempts reached. Please request a new OTP.',
  INVALID_OTP: 'Invalid OTP provided.',
  OTP_EXPIRED: 'OTP has expired.',
  ROLE_NOT_FOUND: 'Role not found.',
  UNEXPECTED_ERROR: 'An unexpected error occurred. Please try again later.',
  UNAUTHORIZED: 'Unauthorized access.',
  INACTIVE_USER: 'User account is inactive.',
  TWILIO_UNVERIFIED_NUMBER:
    'This number is unverified. As we are using a Twilio trial account, we cannot send messages/calls to unverified numbers.',
  TWILIO_GEO_PERMISSION:
    'Geo Permission Error: We are currently unable to send messages to your region due to account restrictions.',
  TWILIO_LIMIT_REACHED: 'Service limits reached. Please try again later.',
  TWILIO_INVALID_NUMBER: 'The phone number provided is invalid.',
  TWILIO_GENERIC_ERROR: 'Failed to deliver OTP. Please try again later.',
  UNSUPPORTED_DELIVERY_METHOD: 'Unsupported delivery method',
  INVALID_TOKEN: 'Invalid or expired token.',
  SESSION_NOT_FOUND: 'Session not found.',
};
export const AuthConstants = {
  OTP_BLOCK_DURATION_MS:
    Number(process.env.OTP_BLOCK_DURATION_MS) || 60 * 60 * 1000,
  OTP_VALIDITY_DURATION_MS:
    Number(process.env.OTP_VALIDITY_DURATION_MS) || 1 * 60 * 1000,
  OTP_THROTTLE_DURATION_MS:
    Number(process.env.OTP_THROTTLE_DURATION_MS) || 30 * 1000,
  MAX_OTP_ATTEMPTS: Number(process.env.MAX_OTP_ATTEMPTS) || 3,
  MAX_OTP_GUESSES: Number(process.env.MAX_OTP_GUESSES) || 3,
  OTP_LENGTH: Number(process.env.OTP_LENGTH) || 6,
  ACCESS_TOKEN_EXPIRY: process.env.ACCESS_TOKEN_EXPIRY || '15m',
  REFRESH_TOKEN_EXPIRY: process.env.REFRESH_TOKEN_EXPIRY || '30d',
};
