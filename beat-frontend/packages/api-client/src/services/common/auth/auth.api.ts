import { API_CONSTANTS } from '../../../constants/api.constants'
import { ERROR_CONSTANTS } from '../../../constants/error.constants'
import { apiClient } from '../../../axios/axios'
import { apiFailureMessage, rethrowWithApiMessage } from '../../../lib/apiErrorMessage'

import type {
  SendOtpRequestBody,
  SendOtpResponse,
  VerifyOtpRequestBody,
  VerifyOtpResponse,
} from './auth.types'

/**
 * POST /auth/send-otp — Request an OTP for login or signup.
 */
export async function sendOtp(body: SendOtpRequestBody): Promise<SendOtpResponse> {
  try {
    const { data } = await apiClient.post<SendOtpResponse>(
      API_CONSTANTS.AUTH_SEND_OTP,
      body
    )

    if (data == null || !data.message) {
      throw new Error(apiFailureMessage(data, ERROR_CONSTANTS.AUTH_SEND_OTP))
    }

    return data
  } catch (error) {
    rethrowWithApiMessage(error)
  }
}

/**
 * POST /auth/verify-otp — Verify OTP and receive auth tokens.
 */
export async function verifyOtp(body: VerifyOtpRequestBody): Promise<VerifyOtpResponse> {
  try {
    const { data } = await apiClient.post<VerifyOtpResponse>(
      API_CONSTANTS.AUTH_VERIFY_OTP,
      body
    )

    if (data == null || !data.accessToken) {
      throw new Error(apiFailureMessage(data, ERROR_CONSTANTS.AUTH_VERIFY_OTP))
    }

    return data
  } catch (error) {
    rethrowWithApiMessage(error)
  }
}
