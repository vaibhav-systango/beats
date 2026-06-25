export type AuthSelector = () => Pick<AuthState, 'isAuthenticated'>

export interface AuthState {
  isAuthenticated: boolean
}
