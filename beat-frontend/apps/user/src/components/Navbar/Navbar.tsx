import Link from 'next/link'

export function Navbar() {
  return (
    <header className="border-b border-border bg-card">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-bold text-primary">
          Beats
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/events"
            className="text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            Events
          </Link>
          <Link
            href="/login"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Sign in
          </Link>
        </div>
      </nav>
    </header>
  )
}
