import { createPageMetadata } from '@/lib'

export const metadata = createPageMetadata(
  'Home',
  'Beat event ticketing platform'
)

export default function HomePage() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="text-3xl font-bold">Beats</h1>
      <p className="mt-2 text-muted-foreground">
        Discover and book tickets for concerts, festivals, and live events. See{' '}
        <code className="rounded bg-muted px-1.5 py-0.5 text-sm">/events</code>{' '}
        for SSR + <code className="rounded bg-muted px-1.5 py-0.5 text-sm">@beat/api-client</code>{' '}
        usage.
      </p>
    </section>
  )
}
