import { Skeleton } from '@/components/ui/skeleton'

interface LoadingStateProps {
  /** Number of placeholder rows to render. */
  rows?: number
}

/** Skeleton rows shown while a list or page is loading. */
export function LoadingState({ rows = 4 }: LoadingStateProps) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-lg" />
      ))}
    </div>
  )
}
