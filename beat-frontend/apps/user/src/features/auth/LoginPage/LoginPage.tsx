'use client'

import {
  saveAccessToken,
  useSendOtp,
  useVerifyOtp,
  type DeliveryMethod,
} from '@beat/api-client'
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
  Zap,
} from '@/components/ui'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { useAuthStore } from '@/store/auth.store'

const DEFAULT_COUNTRY_CODE = '+91'

type LoginStep = 'phone' | 'otp'

const DELIVERY_OPTIONS: {
  value: DeliveryMethod
  label: string
  description: string
  icon: typeof MessageSquare
}[] = [
  {
    value: 'SMS',
    label: 'Text message',
    description: 'Receive a 6-digit code via SMS',
    icon: MessageSquare,
  },
  {
    value: 'VOICE',
    label: 'Phone call',
    description: 'Get your code read aloud on a call',
    icon: Phone,
  },
]

export function LoginPage() {
  const router = useRouter()

  const [step, setStep] = useState<LoginStep>('phone')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('SMS')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState<string | null>(null)

  const sendOtp = useSendOtp()
  const verifyOtp = useVerifyOtp()

  const formattedPhone = `${DEFAULT_COUNTRY_CODE} ${phoneNumber}`

  const handleSendOtp = (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!phoneNumber || phoneNumber.length < 10) {
      setError('Please enter a valid 10-digit phone number')
      return
    }

    sendOtp.mutate(
      {
        countryCode: DEFAULT_COUNTRY_CODE,
        phoneNumber,
        accountType: 'USER',
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

    if (!otp || otp.length !== 6) {
      setError('Please enter the 6-digit code')
      return
    }

    verifyOtp.mutate(
      {
        countryCode: DEFAULT_COUNTRY_CODE,
        phoneNumber,
        accountType: 'USER',
        otpCode: otp,
      },
      {
        onSuccess: (data) => {
          saveAccessToken(data.accessToken)
          useAuthStore.getState().login(
            {
              id: data.account.id,
              fullName: data.account.name,
              email: null,
              phone: data.account.mobileNumber,
            },
            data.isNewUser
          )

          if (data.isNewUser) {
            router.push('/onboarding')
          } else {
            router.push('/')
          }
        },
        onError: (err) => setError(err.message || 'Invalid OTP'),
      }
    )
  }

  const deliveryLabel =
    deliveryMethod === 'VOICE' ? 'via phone call' : 'via text message'

  return (
    <div className="flex min-h-screen w-full bg-background selection:bg-primary selection:text-primary-foreground">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-black p-12 lg:flex">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 z-10 bg-gradient-to-r from-black via-black/50 to-transparent" />
          <Image
            src="https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=2000"
            alt="Concert crowd"
            fill
            className="object-cover opacity-60 mix-blend-screen"
            priority
            sizes="50vw"
          />
        </div>

        <div className="relative z-20 flex items-center gap-2 text-primary">
          <Zap className="h-8 w-8 fill-primary" />
          <span className="text-2xl font-bold tracking-tight text-white">BEATS</span>
        </div>

        <div className="relative z-20">
          <h1 className="mb-4 text-5xl font-extrabold leading-tight text-white">
            Where the city
            <br />
            comes alive.
          </h1>
          <p className="max-w-md text-xl text-white/70">
            The only ticketing platform you need for exclusive underground gigs,
            festivals, and live experiences.
          </p>
        </div>
      </div>

      <div className="flex w-full items-center justify-center p-8 lg:w-1/2">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2 text-center lg:text-left">
            <div className="mb-6 flex items-center justify-center gap-2 text-primary lg:hidden">
              <Zap className="h-6 w-6 fill-primary" />
              <span className="text-xl font-bold tracking-tight">BEATS</span>
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
                    {DEFAULT_COUNTRY_CODE}
                  </div>
                  <Input
                    id="phone"
                    type="tel"
                    inputMode="numeric"
                    placeholder="Enter phone number"
                    value={phoneNumber}
                    onChange={(event) =>
                      setPhoneNumber(event.target.value.replace(/\D/g, '').slice(0, 10))
                    }
                    className="h-12 border-white/10 bg-white/5 text-lg"
                    autoFocus
                  />
                </div>
              </div>

              <fieldset className="space-y-3">
                <legend className="text-sm font-medium text-foreground">
                  How would you like to receive your code?
                </legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {DELIVERY_OPTIONS.map((option) => {
                    const Icon = option.icon
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

              <Button
                type="submit"
                size="lg"
                className="h-12 w-full text-lg font-bold"
                disabled={sendOtp.isPending}
              >
                {sendOtp.isPending ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : null}
                Continue
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="flex justify-center lg:justify-start">
                <InputOTP maxLength={6} value={otp} onChange={setOtp} autoFocus>
                  <InputOTPGroup>
                    {Array.from({ length: 6 }).map((_, index) => (
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
                {verifyOtp.isPending ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : null}
                Verify &amp; continue
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
                        countryCode: DEFAULT_COUNTRY_CODE,
                        phoneNumber,
                        accountType: 'USER',
                        deliveryMethod,
                      },
                      {
                        onSuccess: () => setOtp(''),
                        onError: (err) =>
                          setError(err.message || 'Failed to resend OTP'),
                      }
                    )
                  }}
                >
                  Resend code {deliveryLabel}
                </Button>
              </div>
            </form>
          )}

          <p className="mt-8 text-center text-xs text-muted-foreground">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  )
}
