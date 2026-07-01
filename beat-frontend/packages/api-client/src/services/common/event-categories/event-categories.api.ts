import type { EventCategory } from '@beat/types'

import { API_CONSTANTS } from '../../../constants/api.constants'
import { ERROR_CONSTANTS } from '../../../constants/error.constants'
import { apiClient } from '../../../axios/axios'
import { apiFailureMessage, rethrowWithApiMessage } from '../../../lib/apiErrorMessage'

import type {
  EventCategoriesListResponse,
  GetEventCategoriesParams,
} from './event-categories.types'

export async function getEventCategories(
  params: GetEventCategoriesParams = {}
): Promise<EventCategoriesListResponse> {
  try {
    const { data } = await apiClient.get<EventCategoriesListResponse>(
      API_CONSTANTS.EVENT_CATEGORIES,
      { params }
    )

    if (data == null || !Array.isArray(data.data)) {
      throw new Error(apiFailureMessage(data, ERROR_CONSTANTS.EVENT_CATEGORIES))
    }

    return data
  } catch (error) {
    rethrowWithApiMessage(error)
  }
}

export async function fetchEventCategories(
  params: GetEventCategoriesParams = {}
): Promise<EventCategory[]> {
  const response = await getEventCategories(params)
  return response.data
}
