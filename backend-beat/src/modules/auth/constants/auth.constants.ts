export const AuthMessages = {
  OTP_SENT: 'OTP generated and sent successfully.',
  OTP_RESENT: 'OTP re-sent successfully.',
  OTP_THROTTLED: 'Please wait before requesting a new OTP.',
  TOO_MANY_ATTEMPTS:
    'Maximum OTP request attempts reached. Please try again later.',
  INVALID_OTP: 'Invalid OTP provided.',
  OTP_EXPIRED: 'OTP has expired.',
  ROLE_NOT_FOUND: 'Role not found.',
  UNEXPECTED_ERROR: 'An unexpected error occurred. Please try again later.',
};

export const AuthConstants = {
  OTP_BLOCK_DURATION_MS:
    Number(process.env.OTP_BLOCK_DURATION_MS) || 60 * 60 * 1000,
  OTP_VALIDITY_DURATION_MS:
    Number(process.env.OTP_VALIDITY_DURATION_MS) || 1 * 60 * 1000,
  OTP_THROTTLE_DURATION_MS:
    Number(process.env.OTP_THROTTLE_DURATION_MS) || 30 * 1000,
  MAX_OTP_ATTEMPTS: Number(process.env.MAX_OTP_ATTEMPTS) || 3,
  OTP_LENGTH: Number(process.env.OTP_LENGTH) || 6,
  ACCESS_TOKEN_EXPIRY: process.env.ACCESS_TOKEN_EXPIRY || '15m',
  REFRESH_TOKEN_EXPIRY: process.env.REFRESH_TOKEN_EXPIRY || '30d',
};
