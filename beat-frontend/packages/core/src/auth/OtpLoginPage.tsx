import type { DeliveryMethod } from '@beat/api-client'
import {
  saveAccessToken,
  useSendOtp,
  useVerifyOtp,
} from '@beat/api-client'
import type { UserRole } from '@beat/types'
import {
  ArrowRight,
  Button,
  Input,
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  Loader2,
  MessageSquare,
  Phone,
} from '@beat/ui'
import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

import { AUTH_DEFAULTS } from '../constants/onboarding.constants'
import { DASHBOARD_ROUTES } from '../constants/routes.constants'
import type { UseAuthStore } from './createAuthStore'

type LoginStep = 'phone' | 'otp'

export type OtpLoginDeliveryOption = {
  value: DeliveryMethod
  label: string
  description: string
}

export interface OtpLoginPageConfig {
  accountType: UserRole
  showVoiceOtp: boolean
  brandName: string
  brandIcon?: ReactNode
  heroTitle: string
  heroDescription: string
  heroImageUrl: string
  heroImageAlt: string
  termsNotice: string
  skipOnboarding?: boolean
  dashboardPath?: string
  onboardingPath?: string
}

export interface OtpLoginPageProps {
  config: OtpLoginPageConfig
  useAuthStore: UseAuthStore
}

const DELIVERY_ICONS = {
  SMS: MessageSquare,
  VOICE: Phone,
} as const

const DELIVERY_OPTIONS: OtpLoginDeliveryOption[] = [
  {
    value: 'SMS',
    label: 'Text message',
    description: 'Receive a 6-digit code via SMS',
  },
  {
    value: 'VOICE',
    label: 'Phone call',
    description: 'Get your code read aloud on a call',
  },
]

export function OtpLoginPage({ config, useAuthStore }: OtpLoginPageProps) {
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)

  const [step, setStep] = useState<LoginStep>('phone')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('SMS')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState<string | null>(null)

  const sendOtp = useSendOtp()
  const verifyOtp = useVerifyOtp()

  const formattedPhone = `${AUTH_DEFAULTS.DEFAULT_COUNTRY_CODE} ${phoneNumber}`
  const deliveryOptions = config.showVoiceOtp
    ? DELIVERY_OPTIONS
    : DELIVERY_OPTIONS.filter((option) => option.value === 'SMS')

  const deliveryLabel =
    deliveryMethod === 'VOICE' ? 'via phone call' : 'via text message'

  const handleSendOtp = (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!phoneNumber || phoneNumber.length < AUTH_DEFAULTS.PHONE_LENGTH) {
      setError('Please enter a valid 10-digit phone number')
      return
    }

    sendOtp.mutate(
      {
        countryCode: AUTH_DEFAULTS.DEFAULT_COUNTRY_CODE,
        phoneNumber,
        accountType: config.accountType,
        deliveryMethod,
      },
      {
        onSuccess: () => setStep('otp'),
        onError: (err) => setError(err.message || 'Failed to send OTP'),
      }
    )
  }

  const handleVerifyOtp = (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!otp || otp.length !== AUTH_DEFAULTS.OTP_LENGTH) {
      setError('Please enter the 6-digit code')
      return
    }

    verifyOtp.mutate(
      {
        countryCode: AUTH_DEFAULTS.DEFAULT_COUNTRY_CODE,
        phoneNumber,
        accountType: config.accountType,
        otpCode: otp,
      },
      {
        onSuccess: (data) => {
          saveAccessToken(data.accessToken)

          const needsOnboarding =
            !config.skipOnboarding && data.account.onboardingStatus === 'PROFILE_PENDING'

          login(
            {
              id: data.account.id,
              fullName: data.account.fullName,
              email: null,
              phone: data.account.phoneNumber,
            },
            needsOnboarding
          )

          if (needsOnboarding) {
            navigate(config.onboardingPath ?? DASHBOARD_ROUTES.ONBOARDING, { replace: true })
          } else {
            navigate(config.dashboardPath ?? DASHBOARD_ROUTES.DASHBOARD, { replace: true })
          }
        },
        onError: (err) => setError(err.message || 'Invalid OTP'),
      }
    )
  }

  return (
    <div className="flex min-h-screen w-full bg-background selection:bg-primary selection:text-primary-foreground">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-black p-12 lg:flex">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 z-10 bg-gradient-to-r from-black via-black/50 to-transparent" />
          <img
            src={config.heroImageUrl}
            alt={config.heroImageAlt}
            className="h-full w-full object-cover opacity-60 mix-blend-screen"
          />
        </div>

        <div className="relative z-20 flex items-center gap-2 text-primary">
          {config.brandIcon}
          <span className="text-2xl font-bold tracking-tight text-white">{config.brandName}</span>
        </div>

        <div className="relative z-20">
          <h1 className="mb-4 whitespace-pre-line text-5xl font-extrabold leading-tight text-white">
            {config.heroTitle}
          </h1>
          <p className="max-w-md text-xl text-white/70">{config.heroDescription}</p>
        </div>
      </div>

      <div className="flex w-full items-center justify-center p-8 lg:w-1/2">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2 text-center lg:text-left">
            <div className="mb-6 flex items-center justify-center gap-2 text-primary lg:hidden">
              {config.brandIcon}
              <span className="text-xl font-bold tracking-tight">{config.brandName}</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight">
              {step === 'phone' ? 'Sign in' : 'Enter code'}
            </h2>
            <p className="text-muted-foreground">
              {step === 'phone'
                ? 'Enter your phone number to receive an OTP'
                : `We sent a 6-digit code to ${formattedPhone} ${deliveryLabel}`}
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {error}
            </div>
          )}

          {step === 'phone' ? (
            <form onSubmit={handleSendOtp} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="phone" className="sr-only">
                  Phone number
                </label>
                <div className="flex gap-2">
                  <div className="flex h-12 min-w-[4.5rem] items-center justify-center rounded-md border border-input bg-white/5 px-3 text-lg text-muted-foreground">
                    {AUTH_DEFAULTS.DEFAULT_COUNTRY_CODE}
                  </div>
                  <Input
                    id="phone"
                    type="tel"
                    inputMode="numeric"
                    placeholder="Enter phone number"
                    value={phoneNumber}
                    onChange={(event) =>
                      setPhoneNumber(
                        event.target.value
                          .replace(/\D/g, '')
                          .slice(0, AUTH_DEFAULTS.PHONE_LENGTH)
                      )
                    }
                    className="h-12 border-white/10 bg-white/5 text-lg"
                    autoFocus
                  />
                </div>
              </div>

              {config.showVoiceOtp && (
                <fieldset className="space-y-3">
                  <legend className="text-sm font-medium text-foreground">
                    How would you like to receive your code?
                  </legend>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {deliveryOptions.map((option) => {
                      const Icon = DELIVERY_ICONS[option.value]
                      const isSelected = deliveryMethod === option.value

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setDeliveryMethod(option.value)}
                          className={`rounded-lg border p-4 text-left transition-colors ${
                            isSelected
                              ? 'border-primary bg-primary/10 ring-1 ring-primary'
                              : 'border-input bg-white/5 hover:border-primary/50'
                          }`}
                        >
                          <Icon
                            className={`mb-2 h-5 w-5 ${
                              isSelected ? 'text-primary' : 'text-muted-foreground'
                            }`}
                          />
                          <p className="text-sm font-semibold">{option.label}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {option.description}
                          </p>
                        </button>
                      )
                    })}
                  </div>
                </fieldset>
              )}

              <Button
                type="submit"
                size="lg"
                className="h-12 w-full text-lg font-bold"
                disabled={sendOtp.isPending}
              >
                {sendOtp.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                Continue
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="flex justify-center lg:justify-start">
                <InputOTP
                  maxLength={AUTH_DEFAULTS.OTP_LENGTH}
                  value={otp}
                  onChange={setOtp}
                  autoFocus
                >
                  <InputOTPGroup>
                    {Array.from({ length: AUTH_DEFAULTS.OTP_LENGTH }).map((_, index) => (
                      <InputOTPSlot
                        key={index}
                        index={index}
                        className="h-14 w-12 border-white/20 bg-white/5 text-xl"
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <Button
                type="submit"
                size="lg"
                className="h-12 w-full text-lg font-bold"
                disabled={verifyOtp.isPending}
              >
                {verifyOtp.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                Verify & continue
              </Button>

              <div className="flex flex-col gap-2 text-center lg:text-left">
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-0 text-sm text-muted-foreground"
                  onClick={() => {
                    setStep('phone')
                    setOtp('')
                    setError(null)
                  }}
                >
                  Change phone number
                </Button>
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-0 text-sm text-muted-foreground"
                  disabled={sendOtp.isPending}
                  onClick={() => {
                    setError(null)
                    sendOtp.mutate(
                      {
                        countryCode: AUTH_DEFAULTS.DEFAULT_COUNTRY_CODE,
                        phoneNumber,
                        accountType: config.accountType,
                        deliveryMethod,
                      },
                      {
                        onSuccess: () => setOtp(''),
                        onError: (err) => setError(err.message || 'Failed to resend OTP'),
                      }
                    )
                  }}
                >
                  Resend code {deliveryLabel}
                </Button>
              </div>
            </form>
          )}

          <p className="mt-8 text-center text-xs text-muted-foreground">{config.termsNotice}</p>
        </div>
      </div>
    </div>
  )
}
