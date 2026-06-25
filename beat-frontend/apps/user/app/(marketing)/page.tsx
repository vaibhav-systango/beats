import { createPageMetadata } from '@/lib'

export const metadata = createPageMetadata(
  'Home',
  'Beat event ticketing platform'
)

export default function HomePage() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="text-3xl font-bold">Beat</h1>
      <p className="mt-2 text-gray-600">
        Monorepo reference — Next.js user app. See <code>/events</code> for SSR
        + <code>@beat/api-client</code> usage.
      </p>
    </section>
  )
}
