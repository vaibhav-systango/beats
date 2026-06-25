import { createPageMetadata } from '@/lib'
import { ONBOARDING_COPY, PAGE_METADATA } from '@/constants'

export const metadata = createPageMetadata(
  PAGE_METADATA.ONBOARDING.title,
  PAGE_METADATA.ONBOARDING.description
)

export default function OnboardingPage() {
  return (
    <section className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 py-12 text-center">
      <h1 className="text-3xl font-bold">{ONBOARDING_COPY.TITLE}</h1>
      <p className="mt-2 text-muted-foreground">{ONBOARDING_COPY.DESCRIPTION}</p>
    </section>
  )
}
