import { useMutation, type UseMutationResult } from '@tanstack/react-query'

import { sendOtp, verifyOtp } from './auth.api'
import type {
  SendOtpRequestBody,
  SendOtpResponse,
  VerifyOtpRequestBody,
  VerifyOtpResponse,
} from './auth.types'

export const useSendOtp = (): UseMutationResult<
  SendOtpResponse,
  Error,
  SendOtpRequestBody
> => {
  return useMutation({
    mutationFn: (body: SendOtpRequestBody) => sendOtp(body),
  })
}

export const useVerifyOtp = (): UseMutationResult<
  VerifyOtpResponse,
  Error,
  VerifyOtpRequestBody
> => {
  return useMutation({
    mutationFn: (body: VerifyOtpRequestBody) => verifyOtp(body),
  })
}
