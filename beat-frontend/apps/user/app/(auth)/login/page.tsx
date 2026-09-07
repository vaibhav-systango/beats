import { Suspense } from 'react'

import { createPageMetadata } from '@/lib'
import { LoginPage } from '@/features/auth/LoginPage'
import { PAGE_METADATA } from '@/constants'

export const metadata = createPageMetadata(
  PAGE_METADATA.LOGIN.title,
  PAGE_METADATA.LOGIN.description
)

export default function LoginRoute() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
          Loading...
        </div>
      }
    >
      <LoginPage />
    </Suspense>
  )
}
