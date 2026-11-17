import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { applyTheme, darkMediaQuery, readStoredTheme, storeTheme, type ResolvedTheme, type Theme } from './theme'

interface ThemeContextValue {
  /** The stored preference. */
  theme: Theme
  /** What is on screen right now. */
  resolved: ResolvedTheme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

/** Owns the theme preference, keeps `<html>` in sync and follows the OS when the preference is `system`. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readStoredTheme)
  // The OS setting, kept current by the media-query listener; only read when the preference is `system`.
  const [systemDark, setSystemDark] = useState(() => darkMediaQuery().matches)
  const resolved: ResolvedTheme = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme

  useEffect(() => {
    const mq = darkMediaQuery()
    const onChange = () => setSystemDark(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  // Syncs the document (an external system) with the theme on screen.
  useEffect(() => applyTheme(resolved), [resolved])

  const setTheme = useCallback((next: Theme) => {
    storeTheme(next)
    setThemeState(next)
  }, [])

  const value = useMemo(() => ({ theme, resolved, setTheme }), [theme, resolved, setTheme])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

/** Reads and changes the theme; must be used inside ThemeProvider. */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
  return ctx
}
