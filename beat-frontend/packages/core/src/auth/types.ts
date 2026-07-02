export type AuthSelector = () => Pick<AuthState, 'isAuthenticated' | 'needsOnboarding'>

export interface AuthState {
  isAuthenticated: boolean
  needsOnboarding: boolean
}
