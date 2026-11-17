/** Theme preference as stored; `system` follows the OS setting. */
export type Theme = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

export const THEMES: Theme[] = ['light', 'dark', 'system']

/** localStorage key; index.html reads the same key before first paint to avoid a flash. */
export const THEME_KEY = 'theme'

const DARK_QUERY = '(prefers-color-scheme: dark)'

/** The stored preference, or `system` when nothing valid is stored (or storage is blocked). */
export function readStoredTheme(): Theme {
  try {
    const v = localStorage.getItem(THEME_KEY)
    return v === 'light' || v === 'dark' ? v : 'system'
  } catch {
    return 'system'
  }
}

/** Persists the preference; silently ignores blocked storage. */
export function storeTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {
    // Private mode or blocked storage: the choice lasts for this page only.
  }
}

/** The media query used for `system`; exported so a listener can be attached. */
export function darkMediaQuery(): MediaQueryList {
  return window.matchMedia(DARK_QUERY)
}

/** Turns a preference into the theme that is actually shown. */
export function resolveTheme(theme: Theme): ResolvedTheme {
  if (theme === 'system') return darkMediaQuery().matches ? 'dark' : 'light'
  return theme
}

/** Applies a resolved theme: the `.dark` class Tailwind's dark variant keys off, plus the browser chrome colour. */
export function applyTheme(resolved: ResolvedTheme): void {
  const root = document.documentElement
  root.classList.toggle('dark', resolved === 'dark')
  root.style.colorScheme = resolved
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (meta) meta.content = resolved === 'dark' ? '#111113' : '#f5f8fc'
}
