import { useOnboardUser, useEventCategories } from '@beat/api-client'
import { Button, Input, Label, Loader2, Zap } from '@beat/ui'
import { useState } from 'react'

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

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [city, setCity] = useState<OnboardingCity>('Mumbai')
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const { data: categoriesResponse, isLoading: categoriesLoading } = useEventCategories({
    limit: 100,
    offset: 0,
  })
  const onboardUser = useOnboardUser()

  const categories = categoriesResponse?.data ?? []

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
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4 selection:bg-primary selection:text-primary-foreground">
      <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-white/10 bg-card p-8 shadow-2xl">
        <div className="absolute right-0 top-0 p-8 opacity-10">
          <Zap className="h-64 w-64 text-primary" />
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

              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <select
                  id="city"
                  value={city}
                  onChange={(event) => setCity(event.target.value as OnboardingCity)}
                  className="flex h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {ONBOARDING_CITIES.map((cityOption) => (
                    <option key={cityOption} value={cityOption}>
                      {cityOption}
                    </option>
                  ))}
                </select>
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
