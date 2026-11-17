import { cn } from 'cn'

/** The dealt "stack" mark: three stacked bars, the top one shorter, like a ledger's rows. Draws in `currentColor`. */
export function StackMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn('size-5', className)} aria-hidden fill="currentColor">
      <rect x="4" y="4" width="10" height="4" rx="2" />
      <rect x="4" y="10" width="16" height="4" rx="2" />
      <rect x="4" y="16" width="13" height="4" rx="2" />
    </svg>
  )
}
