import { createPageMetadata } from '@/lib'
import { LoginPage } from '@/features/auth/LoginPage'
import { PAGE_METADATA } from '@/constants'

export const metadata = createPageMetadata(
  PAGE_METADATA.LOGIN.title,
  PAGE_METADATA.LOGIN.description
)

export default function LoginRoute() {
  return <LoginPage />
}
