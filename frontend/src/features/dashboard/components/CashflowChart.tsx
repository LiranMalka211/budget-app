import { useTranslation } from 'react-i18next'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatMonthLabel } from '@/lib/format/dates'
import { formatMoney } from '@/lib/format/money'
import { useLocale } from '@/lib/i18n/useDirection'
import type { MonthlyTotal } from '@/types'
import { ChartCard, ChartLegend } from './ChartCard'
import { CHART, compactCurrency, MARK } from './chartTheme'
import { ChartTooltip } from './ChartTooltip'

interface CashflowChartProps {
  data: MonthlyTotal[]
  fetching?: boolean
}

interface TooltipPayload {
  active?: boolean
  payload?: ReadonlyArray<{ payload?: unknown }>
}

/** Grouped columns of income vs expense per month, with a legend, hover tooltip and a table twin. */
export function CashflowChart({ data, fetching }: CashflowChartProps) {
  const { t } = useTranslation()
  const locale = useLocale()
  const incomeLabel = t('common.income')
  const expenseLabel = t('common.expense')
  const empty = data.every((m) => m.income === 0 && m.expense === 0)

  /** Renders the shared tooltip for the hovered month. */
  const renderTooltip = ({ active, payload }: TooltipPayload) => {
    const datum = payload?.[0]?.payload as MonthlyTotal | undefined
    if (!active || !datum) return null
    return (
      <ChartTooltip
        title={formatMonthLabel(datum.month, locale)}
        rows={[
          { label: incomeLabel, value: datum.income, color: CHART.income },
          { label: expenseLabel, value: datum.expense, color: CHART.expense },
        ]}
      />
    )
  }

  return (
    <ChartCard
      title={t('dashboard.cashflow')}
      description={t('dashboard.cashflowHint')}
      fetching={fetching}
      empty={empty}
      legend={
        <ChartLegend
          items={[
            { label: incomeLabel, color: CHART.income },
            { label: expenseLabel, color: CHART.expense },
          ]}
        />
      }
      table={
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('common.date')}</TableHead>
              <TableHead className="text-end">{incomeLabel}</TableHead>
              <TableHead className="text-end">{expenseLabel}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((m) => (
              <TableRow key={m.month}>
                <TableCell>{formatMonthLabel(m.month, locale)}</TableCell>
                <TableCell className="text-end tabular-nums">{formatMoney(m.income, locale)}</TableCell>
                <TableCell className="text-end tabular-nums">{formatMoney(m.expense, locale)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      }
    >
      <div className="h-64 w-full" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={MARK.barGap} barCategoryGap="30%" margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={CHART.grid} strokeWidth={1} />
            <XAxis
              dataKey="month"
              tickFormatter={(m: string) => formatMonthLabel(m, locale)}
              tick={{ fill: CHART.tick, fontSize: 12 }}
              axisLine={{ stroke: CHART.axis }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v: number) => compactCurrency(v, locale)}
              tick={{ fill: CHART.tick, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={56}
            />
            <Tooltip content={renderTooltip} cursor={false} />
            <Bar dataKey="income" name={incomeLabel} fill={CHART.income} maxBarSize={MARK.maxBarSize} radius={MARK.columnRadius} activeBar={{ fillOpacity: 0.8 }} />
            <Bar dataKey="expense" name={expenseLabel} fill={CHART.expense} maxBarSize={MARK.maxBarSize} radius={MARK.columnRadius} activeBar={{ fillOpacity: 0.8 }} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}
