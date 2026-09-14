import Link from 'next/link'

import { BRAND_CONSTANTS, USER_ROUTES } from '@/constants'

const EXPLORE_LINKS = [
  { href: USER_ROUTES.HOME, label: 'Discover' },
  { href: USER_ROUTES.EVENTS, label: 'Search events' },
  { href: USER_ROUTES.MY_TICKETS, label: 'My tickets' },
  { href: USER_ROUTES.WALLET, label: 'Wallet & rewards' },
] as const

const COMPANY_LINKS = [
  { href: '#', label: 'About' },
  { href: '#', label: 'Careers' },
  { href: '#', label: 'Press' },
  { href: '#', label: 'Contact' },
] as const

function SocialIcon({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <a
      href="#"
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:border-primary/40 hover:text-primary"
    >
      {children}
    </a>
  )
}

export function Footer() {
  return (
    <footer className="relative z-10 mt-16 border-t border-border bg-secondary/40">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 via-primary to-violet-500 text-sm font-black text-white">
              b
            </span>
            <span className="text-lg font-bold tracking-tight text-foreground">
              {BRAND_CONSTANTS.NAME.toLowerCase()}
            </span>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
            Live events, reimagined. Discover, book and earn rewards on every
            show.
          </p>
        </div>

        <div>
          <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-foreground">
            Explore
          </h3>
          <ul className="space-y-2.5">
            {EXPLORE_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-muted-foreground transition hover:text-primary"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-foreground">
            Company
          </h3>
          <ul className="space-y-2.5">
            {COMPANY_LINKS.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  className="text-sm text-muted-foreground transition hover:text-primary"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-foreground">
            Follow
          </h3>
          <div className="mb-4 flex gap-2">
            <SocialIcon label="Instagram">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
              </svg>
            </SocialIcon>
            <SocialIcon label="Twitter">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.743l7.727-8.933L1.25 2.25H8.08l4.253 5.622L18.244 2.25Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
              </svg>
            </SocialIcon>
            <SocialIcon label="YouTube">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
                <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.5 31.5 0 0 0 24 12a31.5 31.5 0 0 0-.5-5.8ZM9.75 15.5v-7l6.5 3.5-6.5 3.5Z" />
              </svg>
            </SocialIcon>
            <SocialIcon label="Email">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m3 7 9 7 9-7" />
              </svg>
            </SocialIcon>
          </div>
          <p className="text-sm text-muted-foreground">Made with ❤️ in Mumbai</p>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-5 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Beats. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-primary">
              Privacy
            </a>
            <a href="#" className="hover:text-primary">
              Terms
            </a>
            <a href="#" className="hover:text-primary">
              Refund
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
