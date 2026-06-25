import { createPageMetadata } from '@/lib'
import { LoginPage } from '@/features/auth/LoginPage'

export const metadata = createPageMetadata(
  'Sign in',
  'Sign in to Beats with your phone number'
)

export default function LoginRoute() {
  return <LoginPage />
}
