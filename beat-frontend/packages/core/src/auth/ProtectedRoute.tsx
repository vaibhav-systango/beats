import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

import type { AuthSelector } from './types'

export interface ProtectedRouteProps {
  children: ReactNode
  useAuth: AuthSelector
  loginPath?: string
}

export function ProtectedRoute({
  children,
  useAuth,
  loginPath = '/login',
}: ProtectedRouteProps) {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to={loginPath} replace />
  }

  return <>{children}</>
}
