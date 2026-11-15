import { BarChart3, TableProperties } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ChartCardProps {
  title: string
  description?: string
  /** Legend or other controls rendered under the title. */
  legend?: ReactNode
  /** The chart itself. */
  children: ReactNode
  /** Accessible table twin of the chart, shown when the user toggles the view. */
  table: ReactNode
  /** Dim the content while new data is loading (no skeleton flash). */
  fetching?: boolean
  empty?: boolean
}

/** Card wrapper for a chart with a chart/table view toggle so every value is reachable without hover. */
export function ChartCard({ title, description, legend, children, table, fetching, empty }: ChartCardProps) {
  const { t } = useTranslation()
  const [view, setView] = useState<'chart' | 'table'>('chart')
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
        <CardAction>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={view === 'chart' ? 'Table view' : 'Chart view'}
            aria-pressed={view === 'table'}
            onClick={() => setView((v) => (v === 'chart' ? 'table' : 'chart'))}
          >
            {view === 'chart' ? <TableProperties /> : <BarChart3 />}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className={cn('transition-opacity', fetching && 'opacity-50')}>
        {empty ? (
          <p className="py-10 text-center text-sm text-muted-foreground">{t('dashboard.noData')}</p>
        ) : view === 'chart' ? (
          <div className="flex flex-col gap-3">
            {legend}
            {children}
          </div>
        ) : (
          table
        )}
      </CardContent>
    </Card>
  )
}

interface LegendItem {
  label: string
  color: string
}

/** Legend row with rectangular swatches (mirrors bar marks); text stays in text tokens. */
export function ChartLegend({ items }: { items: LegendItem[] }) {
  return (
    <ul className="flex flex-wrap gap-4 text-xs text-muted-foreground">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-[2px]" style={{ background: i.color }} aria-hidden />
          {i.label}
        </li>
      ))}
    </ul>
  )
}
