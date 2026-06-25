import Link from 'next/link'

export function Navbar() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-bold text-violet-600">
          Beat
        </Link>
        <Link href="/events" className="text-sm text-gray-600 hover:text-violet-600">
          Events
        </Link>
      </nav>
    </header>
  )
}
