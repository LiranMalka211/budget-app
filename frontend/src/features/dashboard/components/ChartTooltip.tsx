import { useLocale } from '@/lib/i18n/useDirection'
import { formatMoney } from '@/lib/format/money'

interface TooltipRow {
  label: string
  value: number
  color: string
}

interface ChartTooltipProps {
  title: string
  rows: TooltipRow[]
}

/** Tooltip body shared by both charts: value leads, series name follows, keyed by a short colour stroke. */
export function ChartTooltip({ title, rows }: ChartTooltipProps) {
  const locale = useLocale()
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-popover-foreground shadow-md">
      <p className="mb-1 text-xs text-muted-foreground">{title}</p>
      <ul className="flex flex-col gap-1">
        {rows.map((r) => (
          <li key={r.label} className="flex items-center gap-2 text-sm">
            <span className="inline-block h-0.5 w-3 rounded-full" style={{ background: r.color }} aria-hidden />
            <span className="font-semibold tabular-nums">{formatMoney(r.value, locale)}</span>
            <span className="text-muted-foreground">{r.label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
