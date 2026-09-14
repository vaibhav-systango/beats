import Link from 'next/link'

import { USER_ROUTES } from '@/constants'
import { createPageMetadata } from '@/lib'

export const metadata = createPageMetadata(
  'My Tickets',
  'All upcoming shows in one place.'
)

export default function MyTicketsPage() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-4xl font-bold tracking-tight text-foreground">My Tickets</h1>
      <p className="mt-2 text-muted-foreground">All upcoming shows in one place.</p>

      <div className="mt-10 rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
        <p className="text-muted-foreground">
          Sign in after purchase to see your tickets and entry QR codes here.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href={USER_ROUTES.LOGIN}
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Sign in
          </Link>
          <Link
            href={USER_ROUTES.EVENTS}
            className="rounded-full border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground"
          >
            Browse events
          </Link>
        </div>
      </div>
    </section>
  )
}
