import { OtpLoginPage } from '@beat/core'
import { Zap } from '@beat/ui'

import { ORGANISER_AUTH_CONSTANTS, ORGANISER_AUTH_COPY } from '@/constants'
import { useAuthStore } from '@/store'

export function Login() {
  return (
    <OtpLoginPage
      useAuthStore={useAuthStore}
      config={{
        accountType: ORGANISER_AUTH_CONSTANTS.ACCOUNT_TYPE,
        showVoiceOtp: ORGANISER_AUTH_CONSTANTS.SHOW_VOICE_OTP,
        skipOnboarding: ORGANISER_AUTH_CONSTANTS.SKIP_ONBOARDING,
        brandName: ORGANISER_AUTH_COPY.BRAND_NAME,
        brandIcon: <Zap className="h-8 w-8 fill-primary text-primary" />,
        heroTitle: ORGANISER_AUTH_COPY.HERO_TITLE,
        heroDescription: ORGANISER_AUTH_COPY.HERO_DESCRIPTION,
        heroImageUrl: ORGANISER_AUTH_COPY.HERO_IMAGE_URL,
        heroImageAlt: ORGANISER_AUTH_COPY.HERO_IMAGE_ALT,
        termsNotice: ORGANISER_AUTH_COPY.TERMS_NOTICE,
      }}
    />
  )
}
