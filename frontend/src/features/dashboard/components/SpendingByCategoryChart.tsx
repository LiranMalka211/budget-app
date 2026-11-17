import { PieChart as PieIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import { cn } from 'cn'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useCategoryLabel } from '@/hooks/useLookups'
import { formatMoney } from '@/lib/format/money'
import { useLocale } from '@/lib/i18n/useDirection'
import type { CategoryTotal } from '@/types'
import { ChartCard } from './ChartCard'
import { CAN_HOVER, CHART } from './chartTheme'

interface SpendingByCategoryChartProps {
  data: CategoryTotal[]
  fetching?: boolean
}

interface Slice {
  key: string
  name: string
  total: number
  share: number
  color: string
}

/** Categories that get their own slice; everything else folds into a neutral "Other" slice. */
const MAX_SLICES = CHART.categorical.length
/** The built-in catch-all category always joins the "Other" slice instead of taking a hue. */
const OTHER_CATEGORY_ID = 'cat_other_expense'

const percent = (share: number) => `${Math.round(share * 100)}%`


/**
 * Pie (donut) of expenses by category: the largest categories as slices in fixed palette order,
 * the rest folded into a gray "Other", and a list of names, shares and amounts beside it so exact figures never
 * depend on reading angles. The centre shows the period total, or the hovered / tapped slice: there is no
 * floating tooltip, which used to cover the centre label.
 */
export function SpendingByCategoryChart({ data, fetching }: SpendingByCategoryChartProps) {
  const { t } = useTranslation()
  const locale = useLocale()
  const categoryLabel = useCategoryLabel()
  const [active, setActive] = useState<string | null>(null)

  const { slices, total } = useMemo(() => {
    const sum = data.reduce((s, c) => s + c.total, 0)
    const ranked = data.filter((c) => c.total > 0 && c.categoryId !== OTHER_CATEGORY_ID).sort((a, b) => b.total - a.total)
    const head = ranked.slice(0, MAX_SLICES)
    const otherTotal = sum - head.reduce((s, c) => s + c.total, 0)
    const result: Slice[] = head.map((c, i) => ({
      key: c.categoryId,
      name: categoryLabel(c.categoryId) || c.categoryName,
      total: c.total,
      share: sum ? c.total / sum : 0,
      color: CHART.categorical[i],
    }))
    if (otherTotal > 0.005) {
      result.push({ key: 'other', name: t('dashboard.otherSlice'), total: otherTotal, share: otherTotal / sum, color: CHART.other })
    }
    return { slices: result, total: sum }
  }, [data, categoryLabel, t])

  const focused = slices.find((s) => s.key === active) ?? null
  const whole = (n: number) => formatMoney(n, locale, undefined, { maximumFractionDigits: 0 })
  /** Hover (mouse) previews a slice; tap (touch) toggles it. */
  const hover = (key: string | null) => CAN_HOVER && setActive(key)
  const toggle = (key: string) => !CAN_HOVER && setActive((cur) => (cur === key ? null : key))

  return (
    <ChartCard
      title={t('dashboard.byCategory')}
      description={t('dashboard.byCategoryHint')}
      fetching={fetching}
      empty={slices.length === 0}
      chartIcon={PieIcon}
      table={
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('common.category')}</TableHead>
              <TableHead className="text-end">{t('common.amount')}</TableHead>
              <TableHead className="text-end">%</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {slices.map((s) => (
              <TableRow key={s.key}>
                <TableCell>{s.name}</TableCell>
                <TableCell className="text-end tabular-nums">{formatMoney(s.total, locale)}</TableCell>
                <TableCell className="text-end tabular-nums">{percent(s.share)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      }
    >
      <div className="flex flex-col items-center gap-5 sm:flex-row">
        <div className="relative size-48 shrink-0" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={slices}
                dataKey="total"
                nameKey="name"
                innerRadius="64%"
                outerRadius="100%"
                startAngle={90}
                endAngle={-270}
                stroke={CHART.surface}
                strokeWidth={2}
                isAnimationActive={false}
                onMouseEnter={(_, i) => hover(slices[i]?.key ?? null)}
                onMouseLeave={() => hover(null)}
                onClick={(_, i) => slices[i] && toggle(slices[i].key)}
              >
                {slices.map((s) => (
                  <Cell
                    key={s.key}
                    fill={s.color}
                    fillOpacity={active && active !== s.key ? 0.35 : 1}
                    style={{ transition: 'fill-opacity 150ms ease-out', outline: 'none', cursor: 'pointer' }}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          {/* The hole: the period total, or the focused slice. HTML so it uses the app font and stays inside the ring. */}
          <div
            className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-9 text-center"
            aria-live="polite"
          >
            {focused ? (
              <>
                <span className="flex max-w-full items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="size-2 shrink-0 rounded-full" style={{ background: focused.color }} aria-hidden />
                  <span className="truncate">{focused.name}</span>
                </span>
                <span className="text-lg font-semibold tracking-tight tabular-nums">{whole(focused.total)}</span>
                <span className="text-xs text-muted-foreground tabular-nums">{t('dashboard.shareOfSpending', { pct: percent(focused.share) })}</span>
              </>
            ) : (
              <>
                <span className="text-xs text-muted-foreground">{t('dashboard.totalSpent')}</span>
                <span className="text-lg font-semibold tracking-tight tabular-nums">{whole(total)}</span>
              </>
            )}
          </div>
        </div>

        <ul className="flex w-full min-w-0 flex-col gap-0.5" aria-label={t('dashboard.byCategory')}>
          {slices.map((s) => (
            <li
              key={s.key}
              onMouseEnter={() => hover(s.key)}
              onMouseLeave={() => hover(null)}
              onClick={() => toggle(s.key)}
              className={cn(
                'flex cursor-pointer items-center gap-2.5 rounded-md px-1.5 py-1.5 text-sm transition-opacity duration-150',
                active === s.key && 'bg-muted',
                active && active !== s.key && 'opacity-50',
              )}
            >
              <span className="size-2.5 shrink-0 rounded-full" style={{ background: s.color }} aria-hidden />
              <span className="min-w-0 flex-1 truncate" title={s.name}>
                {s.name}
              </span>
              <span className="w-9 shrink-0 text-end text-xs text-muted-foreground tabular-nums">{percent(s.share)}</span>
              <span className="w-[4.5rem] shrink-0 text-end font-medium tabular-nums">{whole(s.total)}</span>
            </li>
          ))}
        </ul>
      </div>
    </ChartCard>
  )
}
