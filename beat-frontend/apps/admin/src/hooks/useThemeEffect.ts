import { useEffect } from 'react'

import { applyTheme, resolveTheme } from '@/lib/theme'
import { useThemeStore } from '@/store'

/**
 * Keeps the document theme in sync with the selected mode. When mode is
 * `system`, it also reacts to live OS color-scheme changes.
 */
export function useThemeEffect(): void {
  const mode = useThemeStore((state) => state.mode)

  useEffect(() => {
    applyTheme(resolveTheme(mode))

    if (mode !== 'system' || !window.matchMedia) {
      return
    }

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => applyTheme(resolveTheme('system'))
    media.addEventListener('change', handleChange)

    return () => media.removeEventListener('change', handleChange)
  }, [mode])
}
