import { useMutation, type UseMutationResult } from '@tanstack/react-query'

import { sendOtp } from './auth.api'
import type { SendOtpRequestBody, SendOtpResponse } from './auth.types'

export const useSendOtp = (): UseMutationResult<
  SendOtpResponse,
  Error,
  SendOtpRequestBody
> => {
  return useMutation({
    mutationFn: (body: SendOtpRequestBody) => sendOtp(body),
  })
}
