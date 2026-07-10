import { useEffect } from 'react'
import { useStore } from '@/store/useStore'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useStore((s) => s.settings.theme)
  const accentColor = useStore((s) => s.settings.accentColor)

  useEffect(() => {
    const root = document.documentElement

    if (theme === 'system') {
      root.removeAttribute('data-theme')
    } else {
      root.setAttribute('data-theme', theme)
    }

    root.style.setProperty('--color-accent', accentColor)
  }, [theme, accentColor])

  return <>{children}</>
}
