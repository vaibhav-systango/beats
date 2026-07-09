import { STORAGE_CONSTANTS } from '../constants/storage.constants'

const ACCESS_TOKEN_KEY = STORAGE_CONSTANTS.ACCESS_TOKEN
const REFRESH_TOKEN_KEY = STORAGE_CONSTANTS.REFRESH_TOKEN

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function saveAccessToken(token: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(ACCESS_TOKEN_KEY, token)
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function saveRefreshToken(token: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(REFRESH_TOKEN_KEY, token)
}

export function clearAccessToken(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(ACCESS_TOKEN_KEY)
}

export function clearRefreshToken(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

export function clearAuthSession(): void {
  clearAccessToken()
  clearRefreshToken()
}
