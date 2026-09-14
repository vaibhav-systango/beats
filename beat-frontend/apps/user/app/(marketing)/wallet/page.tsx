import Link from 'next/link'

import { USER_ROUTES } from '@/constants'
import { createPageMetadata } from '@/lib'

export const metadata = createPageMetadata(
  'Wallet',
  'Beat Credits, tier perks and referrals.'
)

export default function WalletPage() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-4xl font-bold tracking-tight text-foreground">Wallet</h1>
      <p className="mt-2 text-muted-foreground">
        Beat Credits, tier perks and referrals.
      </p>

      <div className="mt-8 overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Beat Credits
            </p>
            <p className="mt-2 text-4xl font-bold text-foreground">0</p>
            <p className="mt-1 text-sm text-muted-foreground">≈ ₹0 value</p>
          </div>
          <span className="rounded-full bg-violet-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-violet-600 dark:text-violet-300">
            ★ Basic member
          </span>
        </div>
        <div className="mt-6">
          <div className="mb-2 flex justify-between text-sm">
            <span className="text-muted-foreground">₹0 of ₹20,000 GMV</span>
            <span className="font-medium text-primary">Silver unlocks with more spend</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-secondary">
            <div className="h-full w-[8%] rounded-full bg-gradient-to-r from-primary via-violet-500 to-cyan-400" />
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          { name: 'Basic', hint: 'Welcome', active: true },
          { name: 'Silver', hint: '₹20,000 GMV', active: false },
          { name: 'Gold', hint: '₹50,000 GMV', active: false },
        ].map((tier) => (
          <div
            key={tier.name}
            className={
              tier.active
                ? 'rounded-3xl border-2 border-primary bg-card p-5 text-center shadow-[0_0_30px_-12px_hsl(var(--primary)/0.7)]'
                : 'rounded-3xl border border-border bg-card p-5 text-center'
            }
          >
            <p className="font-bold text-foreground">{tier.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">{tier.hint}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-6">
        <h2 className="text-lg font-bold text-foreground">Invite friends, earn together</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Share your referral link after you sign in.
        </p>
        <Link
          href={USER_ROUTES.LOGIN}
          className="mt-4 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          Sign in to share
        </Link>
      </div>
    </section>
  )
}
