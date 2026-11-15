import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  /** Buttons rendered at the end of the header row. */
  actions?: ReactNode
}

/** Title block at the top of every page, with an optional subtitle and action buttons. */
export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
