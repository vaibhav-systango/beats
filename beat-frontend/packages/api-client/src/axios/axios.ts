import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import type { ApiError } from '@beat/types'

import { API_CONSTANTS } from '../constants/api.constants'
import { CONFIG_CONSTANTS } from '../constants/config.constants'
import { ERROR_CONSTANTS } from '../constants/error.constants'
import { handleSessionExpired } from '../lib/authSession'
import { refreshAccessToken } from '../lib/refreshAccessToken'
import { getAccessToken, getRefreshToken } from '../lib/tokenStorage'

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

type FailedRequestQueueItem = {
  resolve: (token: string) => void
  reject: (error: unknown) => void
}

let isRefreshing = false
let failedRequestQueue: FailedRequestQueueItem[] = []

const AUTH_PATHS_WITHOUT_REFRESH = [
  API_CONSTANTS.AUTH_SEND_OTP,
  API_CONSTANTS.AUTH_VERIFY_OTP,
  API_CONSTANTS.AUTH_REFRESH_TOKEN,
] as const

function getApiBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.VITE_API_URL ??
    CONFIG_CONSTANTS.DEFAULT_API_BASE_URL
  )
}

function shouldAttemptTokenRefresh(config: InternalAxiosRequestConfig | undefined): boolean {
  if (!config?.url) return false

  return !AUTH_PATHS_WITHOUT_REFRESH.some((path) => config.url?.includes(path))
}

function processFailedRequestQueue(error: unknown, token: string | null = null): void {
  failedRequestQueue.forEach(({ resolve, reject }) => {
    if (error || !token) {
      reject(error)
      return
    }

    resolve(token)
  })

  failedRequestQueue = []
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
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined

    if (error.response?.status !== 401 || !originalRequest) {
      return Promise.reject(normalizeError(error))
    }

    const isRefreshRequest = originalRequest.url?.includes(API_CONSTANTS.AUTH_REFRESH_TOKEN)
    if (isRefreshRequest) {
      handleSessionExpired()
      return Promise.reject(normalizeError(error))
    }

    if (originalRequest._retry || !shouldAttemptTokenRefresh(originalRequest)) {
      return Promise.reject(normalizeError(error))
    }

    if (!getRefreshToken()) {
      handleSessionExpired()
      return Promise.reject(normalizeError(error))
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedRequestQueue.push({ resolve, reject })
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return apiClient(originalRequest)
        })
        .catch((queueError) => Promise.reject(queueError))
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      const newAccessToken = await refreshAccessToken()
      processFailedRequestQueue(null, newAccessToken)
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
      return apiClient(originalRequest)
    } catch (refreshError) {
      processFailedRequestQueue(refreshError, null)

      if (axios.isAxiosError(refreshError) && refreshError.response?.status === 401) {
        handleSessionExpired()
      }

      if (axios.isAxiosError(refreshError)) {
        return Promise.reject(normalizeError(refreshError))
      }

      return Promise.reject(normalizeError(error))
    } finally {
      isRefreshing = false
    }
  }
)
