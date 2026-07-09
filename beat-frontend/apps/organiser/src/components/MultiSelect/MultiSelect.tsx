import { cn } from '@beat/ui'
import { useEffect, useId, useMemo, useRef, useState } from 'react'

export interface MultiSelectOption {
  id: string
  name: string
}

export interface MultiSelectProps {
  options: MultiSelectOption[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
  placeholder?: string
  invalid?: boolean
  ariaLabel?: string
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

export function MultiSelect({
  options,
  selectedIds,
  onChange,
  placeholder = 'Select…',
  invalid = false,
  ariaLabel,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listboxId = useId()

  useEffect(() => {
    if (!open) {
      return
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
        setQuery('')
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
    }
  }, [open])

  const selectedOptions = selectedIds
    .map((id) => options.find((option) => option.id === id))
    .filter((option): option is MultiSelectOption => Boolean(option))

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) {
      return options
    }
    return options.filter((option) =>
      option.name.toLowerCase().includes(normalizedQuery)
    )
  }, [options, query])

  const addOption = (id: string) => {
    if (!selectedIds.includes(id)) {
      onChange([...selectedIds, id])
    }
    setQuery('')
    inputRef.current?.focus()
  }

  const removeOption = (id: string) => {
    onChange(selectedIds.filter((selectedId) => selectedId !== id))
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setOpen(false)
      setQuery('')
      return
    }
    if (
      event.key === 'Backspace' &&
      query === '' &&
      selectedIds.length > 0
    ) {
      removeOption(selectedIds[selectedIds.length - 1])
      return
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      const firstUnselected = filteredOptions.find(
        (option) => !selectedIds.includes(option.id)
      )
      if (firstUnselected) {
        addOption(firstUnselected.id)
      }
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      setOpen(true)
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <div
        onClick={() => {
          setOpen(true)
          inputRef.current?.focus()
        }}
        className={cn(
          'flex min-h-11 w-full cursor-text flex-wrap items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm transition-colors',
          'focus-within:ring-2 focus-within:ring-ring',
          invalid ? 'border-red-500' : 'border-input hover:border-ring/60'
        )}
      >
        {selectedOptions.map((option) => (
          <span
            key={option.id}
            className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-sm text-foreground"
          >
            <button
              type="button"
              aria-label={`Remove ${option.name}`}
              onClick={(event) => {
                event.stopPropagation()
                removeOption(option.id)
              }}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              ×
            </button>
            {option.name}
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-label={ariaLabel}
          aria-autocomplete="list"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={selectedOptions.length === 0 ? placeholder : ''}
          className="min-w-[8rem] flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
      </div>

      {open ? (
        <ul
          id={listboxId}
          role="listbox"
          aria-multiselectable="true"
          className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-border bg-popover p-1 shadow-md"
        >
          {filteredOptions.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">
              {options.length === 0 ? 'No options available' : 'No matches'}
            </li>
          ) : (
            filteredOptions.map((option) => {
              const isSelected = selectedIds.includes(option.id)
              return (
                <li key={option.id} role="option" aria-selected={isSelected}>
                  <button
                    type="button"
                    onClick={() =>
                      isSelected ? removeOption(option.id) : addOption(option.id)
                    }
                    className={cn(
                      'flex w-full items-center justify-between gap-2 rounded-sm px-3 py-2 text-left text-sm transition-colors',
                      isSelected
                        ? 'bg-primary/10 text-foreground'
                        : 'text-foreground hover:bg-muted'
                    )}
                  >
                    {option.name}
                    {isSelected ? (
                      <CheckIcon className="h-4 w-4 shrink-0 text-primary" />
                    ) : null}
                  </button>
                </li>
              )
            })
          )}
        </ul>
      ) : null}
    </div>
  )
}
