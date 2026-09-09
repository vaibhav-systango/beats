import { Navbar, SiteAtmosphere } from '@/components'

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative isolate min-h-screen text-foreground">
      <SiteAtmosphere />
      <div className="relative z-10">
        <Navbar />
        <main className="min-h-screen">{children}</main>
      </div>
    </div>
  )
}
