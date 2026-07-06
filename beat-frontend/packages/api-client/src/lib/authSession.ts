import { clearAuthSession } from './tokenStorage'

let sessionExpiredHandler: (() => void) | null = null

export function registerSessionExpiredHandler(handler: () => void): void {
  sessionExpiredHandler = handler
}

export function handleSessionExpired(): void {
  if (sessionExpiredHandler) {
    sessionExpiredHandler()
    return
  }

  clearAuthSession()
}
