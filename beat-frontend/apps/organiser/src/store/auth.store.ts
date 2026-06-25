import { STORAGE_CONSTANTS } from '@beat/api-client'
import { createAuthStore } from '@beat/core'

export const useAuthStore = createAuthStore(STORAGE_CONSTANTS.ORGANISER_AUTH)
