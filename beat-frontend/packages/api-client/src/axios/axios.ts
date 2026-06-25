import axios, { type AxiosError } from 'axios'
import type { ApiError } from '@beat/types'

import { CONFIG_CONSTANTS } from '../constants/config.constants'
import { ERROR_CONSTANTS } from '../constants/error.constants'
import { getAccessToken } from '../lib/tokenStorage'

function getApiBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.VITE_API_URL ??
    CONFIG_CONSTANTS.DEFAULT_API_BASE_URL
  )
}

export function normalizeError(error: AxiosError<ApiError>): ApiError {
  if (error.response?.data) {
    return {
      message: error.response.data.message ?? ERROR_CONSTANTS.GENERIC,
      statusCode: error.response.status,
      errors: error.response.data.errors,
    }
  }
  return {
    message: error.message ?? ERROR_CONSTANTS.NETWORK,
    statusCode: error.response?.status ?? 500,
  }
}

export const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  headers: { 'Content-Type': CONFIG_CONSTANTS.CONTENT_TYPE_JSON },
  withCredentials: true,
})

apiClient.interceptors.request.use((config) => {
  const accessToken = getAccessToken()

  if (config?.headers && accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => Promise.reject(normalizeError(error))
)
