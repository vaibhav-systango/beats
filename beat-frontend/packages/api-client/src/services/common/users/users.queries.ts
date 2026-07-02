import { useMutation, type UseMutationResult } from '@tanstack/react-query'

import { onboardUser } from './users.api'
import type { OnboardUserRequestBody, OnboardUserResponse } from './users.types'

export const useOnboardUser = (): UseMutationResult<
  OnboardUserResponse,
  Error,
  OnboardUserRequestBody
> => {
  return useMutation({
    mutationFn: (body: OnboardUserRequestBody) => onboardUser(body),
  })
}
