'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'

import { Button, Input } from '@/components/ui'
import { HOME_COPY } from '@/constants'
import { buildEventsHref } from '@/lib'

export function HomeSearch() {
  const router = useRouter()
  const [query, setQuery] = useState('')

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    router.push(buildEventsHref({ q: query }))
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex w-full flex-col gap-3 sm:flex-row"
    >
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={HOME_COPY.SEARCH_PLACEHOLDER}
        aria-label={HOME_COPY.SEARCH_PLACEHOLDER}
        className="h-11 border-white/10 bg-black/25"
      />
      <Button type="submit" className="h-11 shrink-0 px-6">
        {HOME_COPY.SEARCH_CTA}
      </Button>
    </form>
  )
}
