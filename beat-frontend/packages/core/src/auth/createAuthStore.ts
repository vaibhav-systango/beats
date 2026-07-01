import { clearAuthSession } from '@beat/api-client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@beat/types'

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  needsOnboarding: boolean
}

export interface AuthActions {
  login: (user: User, needsOnboarding: boolean) => void
  completeOnboarding: () => void
  updateUser: (updates: Partial<User>) => void
  clearAuth: () => void
}

export type AuthStore = AuthState & AuthActions

export type UseAuthStore = ReturnType<typeof createAuthStore>

export function createAuthStore(storageKey: string) {
  return create<AuthStore>()(
    persist(
      (set, get) => ({
        user: null,
        isAuthenticated: false,
        needsOnboarding: false,
        login: (user, needsOnboarding) =>
          set({ user, isAuthenticated: true, needsOnboarding }),
        completeOnboarding: () => set({ needsOnboarding: false }),
        updateUser: (updates) => {
          const currentUser = get().user
          if (!currentUser) return
          set({ user: { ...currentUser, ...updates } })
        },
        clearAuth: () => {
          clearAuthSession()
          set({ user: null, isAuthenticated: false, needsOnboarding: false })
        },
      }),
      {
        name: storageKey,
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
          needsOnboarding: state.needsOnboarding,
        }),
      }
    )
  )
}
