import axios from 'axios'

import { API_CONSTANTS } from '../constants/api.constants'
import { CONFIG_CONSTANTS } from '../constants/config.constants'
import {
  getRefreshToken,
  saveAccessToken,
  saveRefreshToken,
} from './tokenStorage'

function getApiBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.VITE_API_URL ??
    CONFIG_CONSTANTS.DEFAULT_API_BASE_URL
  )
}

export async function refreshAccessToken(): Promise<string> {
  const refreshToken = getRefreshToken()

  if (!refreshToken) {
    throw new Error('No refresh token available')
  }

  const { data } = await axios.post<{ accessToken: string; refreshToken: string }>(
    `${getApiBaseUrl()}${API_CONSTANTS.AUTH_REFRESH_TOKEN}`,
    { refreshToken },
    {
      headers: { 'Content-Type': CONFIG_CONSTANTS.CONTENT_TYPE_JSON },
      withCredentials: true,
    }
  )

  saveAccessToken(data.accessToken)
  saveRefreshToken(data.refreshToken)

  return data.accessToken
}
