import { createPageMetadata } from '@/lib'
import { BRAND_CONSTANTS, HOME_COPY, PAGE_METADATA } from '@/constants'

export const metadata = createPageMetadata(
  PAGE_METADATA.HOME.title,
  PAGE_METADATA.HOME.description
)

export default function HomePage() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="text-3xl font-bold">{BRAND_CONSTANTS.NAME}</h1>
      <p className="mt-2 text-muted-foreground">
        {HOME_COPY.DESCRIPTION_PREFIX}{' '}
        <code className="rounded bg-muted px-1.5 py-0.5 text-sm">{HOME_COPY.EVENTS_ROUTE}</code>{' '}
        {HOME_COPY.DESCRIPTION_SUFFIX}
      </p>
    </section>
  )
}
