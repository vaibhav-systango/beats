import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { THEME_STORAGE_KEY, applyTheme, resolveTheme } from '@/lib/theme'
import type { ThemeMode } from '@/lib/theme'

interface ThemeState {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'system',
      setMode: (mode) => {
        applyTheme(resolveTheme(mode))
        set({ mode })
      },
    }),
    {
      name: THEME_STORAGE_KEY,
    }
  )
)
