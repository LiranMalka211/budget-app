import { useRef, type ReactNode } from 'react'
import { ENTER_EASE, gsap, prefersReducedMotion, useGSAP } from '@/lib/motion/gsap'

interface PageHeaderProps {
  title: string
  subtitle?: string
  /** Buttons rendered at the end of the header row. */
  actions?: ReactNode
}

/** Title block at the top of every page; its title, subtitle and actions rise in once when the page mounts. */
export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  const scope = useRef<HTMLDivElement>(null)

  // Empty dependencies: plays on mount only, never when the title or actions re-render.
  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      gsap.from('[data-enter]', { y: 10, autoAlpha: 0, duration: 0.4, stagger: 0.08, ease: ENTER_EASE })
    },
    { scope, dependencies: [] },
  )

  return (
    <div ref={scope} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 data-enter className="text-2xl font-bold tracking-tight sm:text-3xl">
          {title}
        </h1>
        {subtitle && (
          <p data-enter className="mt-1 text-sm text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div data-enter className="flex flex-wrap items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  )
}
