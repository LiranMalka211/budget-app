import { CalendarClock, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ROUTES } from '@/app/routes'
import { MoneyText } from '@/components/common/MoneyText'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCategoryLabel, useTypeHelpers } from '@/hooks/useLookups'
import { formatDate } from '@/lib/format/dates'
import { useLocale } from '@/lib/i18n/useDirection'
import { useInsightsInLanguage } from '@/features/insights/useInsightLanguage'
import type { AiInsight, ScheduledTransaction, Transaction } from '@/types'

/** Small "view all" link used in the widget headers. */
function ViewAll({ to }: { to: string }) {
  const { t } = useTranslation()
  return (
    <Button asChild variant="link" size="sm" className="px-0">
      <Link to={to}>{t('dashboard.viewAll')}</Link>
    </Button>
  )
}

/** The most recent transactions in the selected period. */
export function RecentTransactions({ items }: { items: Transaction[] }) {
  const { t } = useTranslation()
  const locale = useLocale()
  const categoryLabel = useCategoryLabel()
  const { isIncome } = useTypeHelpers()
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard.recent')}</CardTitle>
        <CardAction>
          <ViewAll to={ROUTES.transactions} />
        </CardAction>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{t('dashboard.noData')}</p>
        ) : (
          <ul className="divide-y">
            {items.map((tx) => (
              <li key={tx.id} className="flex items-center gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{tx.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {formatDate(tx.date, locale)} · {categoryLabel(tx.categoryId)}
                  </p>
                </div>
                <MoneyText amount={tx.amount} isIncome={isIncome(tx.typeId)} className="text-sm" />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

/** Scheduled payments due soon. */
export function UpcomingScheduled({ items }: { items: ScheduledTransaction[] }) {
  const { t } = useTranslation()
  const locale = useLocale()
  const { isIncome } = useTypeHelpers()
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard.upcoming')}</CardTitle>
        <CardAction>
          <ViewAll to={ROUTES.scheduled} />
        </CardAction>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{t('scheduled.empty')}</p>
        ) : (
          <ul className="divide-y">
            {items.map((s) => (
              <li key={s.id} className="flex items-center gap-3 py-2.5">
                <CalendarClock className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{s.title}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(s.nextRunDate, locale)}</p>
                </div>
                <MoneyText amount={s.amount} isIncome={isIncome(s.typeId)} className="text-sm" />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

/** The newest generation of AI insights, in the active language, with a link to the full list. */
export function LatestInsights({ insights }: { insights: AiInsight[] }) {
  const { t } = useTranslation()
  const items = useInsightsInLanguage(insights)
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="size-4 text-amber-500" /> {t('dashboard.latestInsights')}
        </CardTitle>
        <CardAction>
          <ViewAll to={ROUTES.insights} />
        </CardAction>
      </CardHeader>
      <CardContent>
        {items.length ? (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {items.map((insight) => (
              <li key={insight.id} className="rounded-xl bg-muted/50 p-4">
                <p className="font-medium">{insight.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{insight.body}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">{t('insights.emptyHint')}</p>
        )}
      </CardContent>
    </Card>
  )
}
