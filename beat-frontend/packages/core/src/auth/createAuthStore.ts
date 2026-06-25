import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@beat/types'

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
}

export interface AuthActions {
  setUser: (user: User) => void
  clearAuth: () => void
}

export type AuthStore = AuthState & AuthActions

export function createAuthStore(storageKey: string) {
  return create<AuthStore>()(
    persist(
      (set) => ({
        user: null,
        isAuthenticated: false,
        setUser: (user) => set({ user, isAuthenticated: true }),
        clearAuth: () => set({ user: null, isAuthenticated: false }),
      }),
      { name: storageKey }
    )
  )
}
