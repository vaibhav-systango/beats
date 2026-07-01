import { OtpLoginPage } from '@beat/core'
import { ShieldCheck } from '@beat/ui'

import { ADMIN_AUTH_CONSTANTS, ADMIN_AUTH_COPY } from '@/constants'
import { useAuthStore } from '@/store'

export function Login() {
  return (
    <OtpLoginPage
      useAuthStore={useAuthStore}
      config={{
        accountType: ADMIN_AUTH_CONSTANTS.ACCOUNT_TYPE,
        showVoiceOtp: ADMIN_AUTH_CONSTANTS.SHOW_VOICE_OTP,
        skipOnboarding: ADMIN_AUTH_CONSTANTS.SKIP_ONBOARDING,
        brandName: ADMIN_AUTH_COPY.BRAND_NAME,
        brandIcon: <ShieldCheck className="h-8 w-8 text-red-500" />,
        heroTitle: ADMIN_AUTH_COPY.HERO_TITLE,
        heroDescription: ADMIN_AUTH_COPY.HERO_DESCRIPTION,
        heroImageUrl: ADMIN_AUTH_COPY.HERO_IMAGE_URL,
        heroImageAlt: ADMIN_AUTH_COPY.HERO_IMAGE_ALT,
        termsNotice: ADMIN_AUTH_COPY.TERMS_NOTICE,
      }}
    />
  )
}
