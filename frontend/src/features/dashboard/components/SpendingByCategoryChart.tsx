import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useCategoryLabel } from '@/hooks/useLookups'
import { formatMoney } from '@/lib/format/money'
import { useLocale } from '@/lib/i18n/useDirection'
import type { CategoryTotal } from '@/types'
import { ChartCard } from './ChartCard'
import { CHART, compactCurrency, MARK } from './chartTheme'
import { ChartTooltip } from './ChartTooltip'

interface SpendingByCategoryChartProps {
  data: CategoryTotal[]
  fetching?: boolean
}

interface Row {
  name: string
  total: number
  share: number
}

/** Keep the top N categories as their own bars and fold the tail into "Other". */
const MAX_BARS = 7

interface TooltipPayload {
  active?: boolean
  payload?: ReadonlyArray<{ payload?: unknown }>
}

/** Ranked horizontal bars of expense by category (largest first, one hue), with value at the tip and a table twin. */
export function SpendingByCategoryChart({ data, fetching }: SpendingByCategoryChartProps) {
  const { t } = useTranslation()
  const locale = useLocale()
  const categoryLabel = useCategoryLabel()

  const rows = useMemo<Row[]>(() => {
    const total = data.reduce((s, c) => s + c.total, 0)
    const sorted = [...data].sort((a, b) => b.total - a.total)
    const head = sorted.slice(0, MAX_BARS)
    const tail = sorted.slice(MAX_BARS)
    const result = head.map((c) => ({
      name: categoryLabel(c.categoryId) || c.categoryName,
      total: c.total,
      share: total ? c.total / total : 0,
    }))
    if (tail.length) {
      const otherTotal = tail.reduce((s, c) => s + c.total, 0)
      const otherName = t('categories.otherExpense')
      // Merge into the real "Other" category when it is already a bar, so the name never appears twice.
      const existing = result.find((r) => r.name === otherName)
      if (existing) {
        existing.total += otherTotal
        existing.share = total ? existing.total / total : 0
      } else {
        result.push({ name: otherName, total: otherTotal, share: total ? otherTotal / total : 0 })
      }
    }
    return result.sort((a, b) => b.total - a.total)
  }, [data, categoryLabel, t])

  /** Tooltip for the hovered bar: amount and share of all expenses. */
  const renderTooltip = ({ active, payload }: TooltipPayload) => {
    const datum = payload?.[0]?.payload as Row | undefined
    if (!active || !datum) return null
    return (
      <ChartTooltip
        title={`${datum.name} · ${Math.round(datum.share * 100)}%`}
        rows={[{ label: t('common.expense'), value: datum.total, color: CHART.magnitude }]}
      />
    )
  }

  // Each bar band is 32px so the card grows with the number of categories instead of squeezing them.
  const height = Math.max(160, rows.length * 32 + 16)

  return (
    <ChartCard
      title={t('dashboard.byCategory')}
      description={t('dashboard.byCategoryHint')}
      fetching={fetching}
      empty={rows.length === 0}
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
            {rows.map((r) => (
              <TableRow key={r.name}>
                <TableCell>{r.name}</TableCell>
                <TableCell className="text-end tabular-nums">{formatMoney(r.total, locale)}</TableCell>
                <TableCell className="text-end tabular-nums">{Math.round(r.share * 100)}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      }
    >
      <div className="w-full" style={{ height }} dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" barCategoryGap={MARK.barGap * 3} margin={{ top: 0, right: 72, left: 0, bottom: 0 }}>
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              width={110}
              tick={{ fill: CHART.tick, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              interval={0}
            />
            <Tooltip content={renderTooltip} cursor={false} />
            <Bar dataKey="total" fill={CHART.magnitude} maxBarSize={MARK.maxBarSize} radius={MARK.horizontalRadius} activeBar={{ fillOpacity: 0.8 }}>
              <LabelList
                dataKey="total"
                position="right"
                offset={8}
                formatter={(v: unknown) => compactCurrency(Number(v), locale)}
                style={{ fill: CHART.tick, fontSize: 12 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}
