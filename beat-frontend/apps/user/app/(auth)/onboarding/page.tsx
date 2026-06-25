import { createPageMetadata } from '@/lib'

export const metadata = createPageMetadata(
  'Welcome',
  'Complete your Beats profile'
)

export default function OnboardingPage() {
  return (
    <section className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 py-12 text-center">
      <h1 className="text-3xl font-bold">Welcome to Beats</h1>
      <p className="mt-2 text-muted-foreground">
        Onboarding flow coming soon. You are signed in.
      </p>
    </section>
  )
}
