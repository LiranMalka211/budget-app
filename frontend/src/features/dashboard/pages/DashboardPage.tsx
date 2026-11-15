import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { PageHeader } from '@/components/common/PageHeader'
import { BalanceCards } from '../components/BalanceCards'
import { CashflowChart } from '../components/CashflowChart'
import { LatestInsight, RecentTransactions, UpcomingScheduled } from '../components/DashboardLists'
import { RangeSelect } from '../components/RangeSelect'
import { SpendingByCategoryChart } from '../components/SpendingByCategoryChart'
import { presetToRange, type RangePreset } from '../rangePresets'
import { useDashboardSummary } from '../useDashboard'

/** Dashboard: one date-range filter scoping the KPI row, both charts and the three widgets below. */
export default function DashboardPage() {
  const { t } = useTranslation()
  const [preset, setPreset] = useState<RangePreset>('thisMonth')
  const range = useMemo(() => presetToRange(preset), [preset])
  const query = useDashboardSummary(range.from, range.to)
  const fetching = query.isFetching && !query.isPending

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t('dashboard.title')} subtitle={t('dashboard.subtitle')} actions={<RangeSelect value={preset} onChange={setPreset} />} />

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
              fetching={fetching}
            />
            <div className="grid gap-6 lg:grid-cols-5">
              <div className="lg:col-span-3">
                <CashflowChart data={query.data.byMonth} fetching={fetching} />
              </div>
              <div className="lg:col-span-2">
                <SpendingByCategoryChart data={query.data.byCategory} fetching={fetching} />
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              <RecentTransactions items={query.data.recentTransactions} />
              <UpcomingScheduled items={query.data.upcomingScheduled} />
              <LatestInsight insight={query.data.latestInsight} />
            </div>
          </>
        )
      )}
    </div>
  )
}
