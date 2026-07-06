import { Input, Label } from '@beat/ui'
import { useEffect, useId, useRef, useState } from 'react'

import { searchLocations, type LocationSearchResult } from '@/lib/geocode'

export interface LocationSearchInputProps {
  id?: string
  label: string
  value: string
  placeholder?: string
  onValueChange: (value: string) => void
  onSelect: (result: LocationSearchResult) => void
}

export function LocationSearchInput({
  id,
  label,
  value,
  placeholder,
  onValueChange,
  onSelect,
}: LocationSearchInputProps) {
  const listId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const [results, setResults] = useState<LocationSearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    if (!value.trim() || value.trim().length < 3) {
      setResults([])
      setIsOpen(false)
      return
    }

    const timeout = window.setTimeout(() => {
      setIsSearching(true)
      void searchLocations(value)
        .then((items) => {
          setResults(items)
          setIsOpen(items.length > 0)
        })
        .finally(() => setIsSearching(false))
    }, 350)

    return () => window.clearTimeout(timeout)
  }, [value])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className="relative space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        onFocus={() => {
          if (results.length > 0) {
            setIsOpen(true)
          }
        }}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={listId}
      />
      {isSearching ? (
        <p className="text-xs text-muted-foreground">Searching locations…</p>
      ) : null}
      {isOpen ? (
        <ul
          id={listId}
          role="listbox"
          className="scrollbar-themed absolute z-20 mt-1 max-h-56 w-full overflow-y-auto overscroll-contain rounded-md border border-border bg-popover py-1 pr-1 shadow-md"
        >
          {results.map((result) => (
            <li key={result.id} role="option">
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                onClick={() => {
                  onValueChange(result.label)
                  onSelect(result)
                  setIsOpen(false)
                }}
              >
                {result.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
