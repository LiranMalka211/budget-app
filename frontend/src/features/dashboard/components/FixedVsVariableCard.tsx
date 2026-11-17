import { Repeat, Shuffle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { cn } from 'cn'
import { ROUTES } from '@/app/routes'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatMoney } from '@/lib/format/money'
import { useLocale } from '@/lib/i18n/useDirection'
import { CHART } from './chartTheme'

interface FixedVsVariableCardProps {
  fixed: number
  variable: number
  fetching?: boolean
}

/**
 * Fixed expenses (created by scheduled payments) against variable ones (everything else) for the range:
 * one split bar and the two figures with their shares.
 */
export function FixedVsVariableCard({ fixed, variable, fetching }: FixedVsVariableCardProps) {
  const { t } = useTranslation()
  const locale = useLocale()
  const total = fixed + variable
  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0)
  const rows = [
    { key: 'fixed', label: t('dashboard.fixed'), hint: t('dashboard.fixedHint'), value: fixed, color: CHART.categorical[0], icon: Repeat },
    { key: 'variable', label: t('dashboard.variable'), hint: t('dashboard.variableHint'), value: variable, color: CHART.categorical[1], icon: Shuffle },
  ]

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{t('dashboard.fixedVsVariable')}</CardTitle>
        <CardDescription>{t('dashboard.fixedVsVariableHint')}</CardDescription>
        <CardAction>
          <Button asChild variant="link" size="sm" className="px-0">
            <Link to={ROUTES.scheduled}>{t('dashboard.manageScheduled')}</Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className={cn('flex flex-col gap-5 transition-opacity', fetching && 'opacity-50')}>
        {total === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{t('dashboard.noData')}</p>
        ) : (
          <>
            <div
              className="flex h-3 w-full overflow-hidden rounded-full bg-muted"
              role="img"
              aria-label={rows.map((r) => `${r.label} ${pct(r.value)}%`).join(', ')}
            >
              {rows.map((r) =>
                r.value > 0 ? <div key={r.key} style={{ width: `${(r.value / total) * 100}%`, background: r.color }} /> : null,
              )}
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {rows.map(({ key, label, hint, value, color, icon: Icon }) => (
                <li key={key} className="flex items-start gap-3 rounded-xl bg-muted/50 p-3">
                  <span
                    className="flex size-8 shrink-0 items-center justify-center rounded-lg text-white"
                    style={{ background: color }}
                    aria-hidden
                  >
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">
                      {label} · {pct(value)}%
                    </p>
                    <p className="text-lg font-semibold tracking-tight tabular-nums">
                      {formatMoney(value, locale, undefined, { maximumFractionDigits: 0 })}
                    </p>
                    <p className="text-xs text-muted-foreground">{hint}</p>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  )
}
