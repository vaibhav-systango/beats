import { API_CONSTANTS } from '../../../constants/api.constants'
import { ERROR_CONSTANTS } from '../../../constants/error.constants'
import { apiClient } from '../../../axios/axios'
import { apiFailureMessage, rethrowWithApiMessage } from '../../../lib/apiErrorMessage'

import type { OnboardUserRequestBody, OnboardUserResponse } from './users.types'

export async function onboardUser(body: OnboardUserRequestBody): Promise<OnboardUserResponse> {
  try {
    const { data } = await apiClient.put<OnboardUserResponse>(
      API_CONSTANTS.USERS_ONBOARDING,
      body
    )

    if (data == null || !data.message) {
      throw new Error(apiFailureMessage(data, ERROR_CONSTANTS.USER_ONBOARDING))
    }

    return data
  } catch (error) {
    rethrowWithApiMessage(error)
  }
}
