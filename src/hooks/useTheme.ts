import { useAppStore, type Theme } from '@store/index'
import { useCallback, useEffect } from 'react'

function getSystemTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getStoredTheme(): Theme | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('app-store')
    if (!raw) return null
    const parsed = JSON.parse(raw) as { state?: { theme?: unknown } }
    const stored = parsed?.state?.theme
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    // persist 직렬화 형식이 깨졌을 때는 시스템 설정으로 폴백
  }
  return null
}

function useTheme() {
  const theme = useAppStore((s) => s.theme)
  const setStoreTheme = useAppStore((s) => s.setTheme)

  useEffect(() => {
    if (getStoredTheme() === null) {
      setStoreTheme(getSystemTheme())
    }
  }, [setStoreTheme])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return

    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (event: MediaQueryListEvent) => {
      if (getStoredTheme() !== null) return
      setStoreTheme(event.matches ? 'dark' : 'light')
    }

    mql.addEventListener('change', handleChange)
    return () => {
      mql.removeEventListener('change', handleChange)
    }
  }, [setStoreTheme])

  const toggleTheme = useCallback(() => {
    setStoreTheme(theme === 'light' ? 'dark' : 'light')
  }, [theme, setStoreTheme])

  return { theme, toggleTheme, setTheme: setStoreTheme, isDark: theme === 'dark' }
}

export default useTheme
