import { ThemeToggleView } from './ThemeToggleView'

import { THEME_OPTIONS } from '@/lib/theme'
import { useThemeStore } from '@/store'

export function ThemeToggle() {
  const mode = useThemeStore((state) => state.mode)
  const setMode = useThemeStore((state) => state.setMode)

  return <ThemeToggleView mode={mode} options={THEME_OPTIONS} onSelect={setMode} />
}
