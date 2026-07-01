import { createPageMetadata } from '@/lib'
import { OnboardingPage } from '@/features/auth/OnboardingPage'
import { PAGE_METADATA } from '@/constants'

export const metadata = createPageMetadata(
  PAGE_METADATA.ONBOARDING.title,
  PAGE_METADATA.ONBOARDING.description
)

export default function OnboardingRoute() {
  return <OnboardingPage />
}
