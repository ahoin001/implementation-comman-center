import { useEffect } from 'react'
import { useStore } from '@/store/useStore'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useStore((s) => s.settings.theme)
  const accentColor = useStore((s) => s.settings.accentColor)

  useEffect(() => {
    const root = document.documentElement
    const media = window.matchMedia('(prefers-color-scheme: dark)')

    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && media.matches)
      root.classList.toggle('dark', dark)
      const next = dark ? 'dark' : 'light'
      root.setAttribute('data-theme', next)
      try {
        localStorage.setItem('icc-theme', next)
      } catch {
        /* private mode */
      }
    }

    apply()
    if (theme !== 'system') return
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [theme])

  useEffect(() => {
    document.documentElement.style.setProperty('--color-accent', accentColor)
  }, [accentColor])

  return <>{children}</>
}
