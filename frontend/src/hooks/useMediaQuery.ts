import { useEffect, useState } from 'react'

/** Returns true while the given CSS media query matches; re-renders when it changes. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  )
  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = () => setMatches(mql.matches)
    onChange()
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])
  return matches
}

/** True on viewports narrower than Tailwind's `lg` breakpoint (phones and tablets). */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 1023px)')
}
