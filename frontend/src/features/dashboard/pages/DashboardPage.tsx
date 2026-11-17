import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { PageHeader } from '@/components/common/PageHeader'
import { useAuth } from '@/features/auth/authStore'
import { BalanceCards } from '../components/BalanceCards'
import { CashflowChart } from '../components/CashflowChart'
import { FixedVsVariableCard } from '../components/FixedVsVariableCard'
import { MonthBudgetCard } from '../components/MonthBudgetCard'
import { LatestInsights, RecentTransactions, UpcomingScheduled } from '../components/DashboardLists'
import { RangeSelect } from '../components/RangeSelect'
import { SpendingByCategoryChart } from '../components/SpendingByCategoryChart'
import { dayPart } from '../greeting'
import { presetToRange, type RangePreset } from '../rangePresets'
import { useDashboardSummary } from '../useDashboard'

/** Dashboard: one date-range filter scoping the KPI row, both charts and the lists below; the latest insights close it. */
export default function DashboardPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [hour, setHour] = useState(() => new Date().getHours())
  // Keeps the greeting right when the page stays open across a part of the day.
  useEffect(() => {
    const id = window.setInterval(() => setHour(new Date().getHours()), 60_000)
    return () => window.clearInterval(id)
  }, [])
  const name = user ? `${user.firstName} ${user.lastName}`.trim() : ''
  const greeting = t(`dashboard.greeting.${dayPart(hour)}`, { name })
  const [preset, setPreset] = useState<RangePreset>('thisMonth')
  const range = useMemo(() => presetToRange(preset), [preset])
  const query = useDashboardSummary(range.from, range.to)
  const fetching = query.isFetching && !query.isPending

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={greeting} subtitle={t('dashboard.subtitle')} actions={<RangeSelect value={preset} onChange={setPreset} />} />

      {query.isPending ? (
        <LoadingState rows={5} />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : (
        query.data && (
          <>
            <BalanceCards
              totalIncome={query.data.totalIncome}
              totalExpense={query.data.totalExpense}
              balance={query.data.balance}
              from={range.from}
              to={range.to}
              fetching={fetching}
            />
            <div className="grid gap-6 lg:grid-cols-2">
              <MonthBudgetCard budget={query.data.monthBudget} />
              <FixedVsVariableCard
                fixed={query.data.fixedExpense}
                variable={query.data.variableExpense}
                fetching={fetching}
              />
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <SpendingByCategoryChart data={query.data.byCategory} fetching={fetching} />
              <CashflowChart data={query.data.byMonth} fetching={fetching} />
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <RecentTransactions items={query.data.recentTransactions} />
              <UpcomingScheduled items={query.data.upcomingScheduled} />
            </div>
            <LatestInsights insights={query.data.latestInsights} />
          </>
        )
      )}
    </div>
  )
}
