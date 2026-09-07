import { useOnboardUser, useEventCategories } from '@beat/api-client'
import { Button, Input, Label, Loader2, Zap } from '@beat/ui'
import { useEffect, useId, useRef, useState } from 'react'

import {
  ONBOARDING_CITIES,
  ONBOARDING_CITY_COORDINATES,
  ONBOARDING_VALIDATION,
  type OnboardingCity,
} from '../constants/onboarding.constants'
import type { UseAuthStore } from './createAuthStore'

export interface OnboardingPageCopy {
  title: string
  description: string
  submitLabel: string
}

export interface OnboardingPageProps {
  useAuthStore: UseAuthStore
  copy: OnboardingPageCopy
  onSuccess: () => void
}

export function OnboardingPage({
  useAuthStore,
  copy,
  onSuccess,
}: OnboardingPageProps) {
  const completeOnboarding = useAuthStore((state) => state.completeOnboarding)
  const updateUser = useAuthStore((state) => state.updateUser)
  const cityListId = useId()
  const cityDropdownRef = useRef<HTMLDivElement>(null)

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [city, setCity] = useState<OnboardingCity>('Mumbai')
  const [isCityOpen, setIsCityOpen] = useState(false)
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const { data: categoriesResponse, isLoading: categoriesLoading } = useEventCategories({
    limit: 100,
    offset: 0,
  })
  const onboardUser = useOnboardUser()

  const categories = categoriesResponse?.data ?? []

  useEffect(() => {
    if (!isCityOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      if (!cityDropdownRef.current?.contains(event.target as Node)) {
        setIsCityOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsCityOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isCityOpen])

  const toggleCategory = (categoryId: string) => {
    setSelectedCategoryIds((current) =>
      current.includes(categoryId)
        ? current.filter((id) => id !== categoryId)
        : [...current, categoryId]
    )
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!fullName.trim()) {
      setError('Please enter your full name')
      return
    }

    if (selectedCategoryIds.length < ONBOARDING_VALIDATION.MIN_CATEGORIES) {
      setError(`Please select at least ${ONBOARDING_VALIDATION.MIN_CATEGORIES} categories`)
      return
    }

    onboardUser.mutate(
      {
        fullName: fullName.trim(),
        email: email.trim() || undefined,
        location: ONBOARDING_CITY_COORDINATES[city],
        categoryIds: selectedCategoryIds,
      },
      {
        onSuccess: () => {
          completeOnboarding()
          updateUser({
            fullName: fullName.trim(),
            email: email.trim() || null,
          })
          onSuccess()
        },
        onError: (err) => setError(err.message || 'Failed to save profile'),
      }
    )
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background p-4 selection:bg-primary selection:text-primary-foreground">
      <style>{`
        @keyframes beats-drift-a {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(4%, -3%) scale(1.08); }
        }
        @keyframes beats-drift-b {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-5%, 4%) scale(1.06); }
        }
        @keyframes beats-glow {
          0%, 100% { opacity: 0.45; }
          50% { opacity: 0.75; }
        }
      `}</style>

      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 55% at 15% 10%, hsl(262 83% 68% / 0.28), transparent 55%), radial-gradient(ellipse 70% 50% at 90% 85%, hsl(315 80% 62% / 0.22), transparent 50%), radial-gradient(ellipse 50% 40% at 50% 50%, hsl(262 70% 40% / 0.12), transparent 70%)',
          }}
        />
        <div
          className="absolute -left-20 top-[12%] h-72 w-72 rounded-full blur-3xl"
          style={{
            background: 'hsl(262 83% 68% / 0.35)',
            animation: 'beats-drift-a 14s ease-in-out infinite',
          }}
        />
        <div
          className="absolute -right-24 bottom-[8%] h-80 w-80 rounded-full blur-3xl"
          style={{
            background: 'hsl(315 80% 62% / 0.28)',
            animation: 'beats-drift-b 18s ease-in-out infinite',
          }}
        />
        <div
          className="absolute left-1/2 top-1/3 h-40 w-40 -translate-x-1/2 rounded-full blur-2xl"
          style={{
            background: 'hsl(262 83% 68% / 0.2)',
            animation: 'beats-glow 8s ease-in-out infinite',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              'linear-gradient(hsl(0 0% 100% / 0.06) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 100% / 0.06) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
            maskImage:
              'radial-gradient(ellipse 70% 60% at 50% 40%, black 20%, transparent 75%)',
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-1/3"
          style={{
            background:
              'linear-gradient(to top, hsl(240 10% 4% / 0.85), transparent)',
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-xl overflow-visible rounded-3xl border border-primary/20 bg-card/90 p-8 shadow-2xl shadow-primary/10 backdrop-blur-md">
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl" aria-hidden>
          <div className="absolute right-0 top-0 p-8 opacity-10">
            <Zap className="h-64 w-64 text-primary" />
          </div>
          <div
            className="absolute inset-x-0 top-0 h-px"
            style={{
              background:
                'linear-gradient(90deg, transparent, hsl(262 83% 68% / 0.55), hsl(315 80% 62% / 0.45), transparent)',
            }}
          />
        </div>

        <div className="relative z-10 space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight">{copy.title}</h1>
            <p className="text-muted-foreground">{copy.description}</p>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  placeholder="e.g. Rahul Sharma"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  className="border-white/10 bg-white/5"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="border-white/10 bg-white/5"
                />
              </div>

              <div className="relative z-30 space-y-2">
                <Label htmlFor="city">City</Label>
                <div ref={cityDropdownRef} className="relative">
                  <button
                    id="city"
                    type="button"
                    aria-haspopup="listbox"
                    aria-expanded={isCityOpen}
                    aria-controls={cityListId}
                    onClick={() => setIsCityOpen((open) => !open)}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-left text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <span>{city}</span>
                    <span className="text-muted-foreground" aria-hidden="true">
                      {isCityOpen ? '▴' : '▾'}
                    </span>
                  </button>

                  {isCityOpen ? (
                    <ul
                      id={cityListId}
                      role="listbox"
                      aria-labelledby="city"
                      className="absolute left-0 top-full z-50 mt-1 w-full rounded-md border border-border bg-background py-1 shadow-lg"
                      style={{ maxHeight: 240, overflowY: 'auto' }}
                    >
                      {ONBOARDING_CITIES.map((cityOption) => {
                        const isSelected = cityOption === city
                        return (
                          <li key={cityOption} role="option" aria-selected={isSelected}>
                            <button
                              type="button"
                              className={`flex w-full px-3 py-2 text-left text-sm transition-colors ${
                                isSelected
                                  ? 'bg-primary text-primary-foreground'
                                  : 'text-foreground hover:bg-muted'
                              }`}
                              onClick={() => {
                                setCity(cityOption)
                                setIsCityOpen(false)
                              }}
                            >
                              {cityOption}
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  ) : null}
                </div>
              </div>

              <div className="space-y-3 border-t border-white/10 pt-4">
                <Label>What are you into?</Label>
                {categoriesLoading ? (
                  <p className="text-sm text-muted-foreground">Loading categories...</p>
                ) : categories.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No categories available. Please try again later.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => {
                      const isSelected = selectedCategoryIds.includes(category.id)

                      return (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => toggleCategory(category.id)}
                          className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                            isSelected
                              ? 'bg-primary text-primary-foreground shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                              : 'border border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10'
                          }`}
                        >
                          {category.name}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="h-12 w-full text-lg font-bold"
              disabled={onboardUser.isPending || categoriesLoading}
            >
              {onboardUser.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
              {copy.submitLabel}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
