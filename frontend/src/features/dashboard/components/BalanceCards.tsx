import { ArrowDownRight, ArrowUpRight, Wallet } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from 'cn'
import { Card, CardContent } from '@/components/ui/card'
import { formatMoney } from '@/lib/format/money'
import { useLocale } from '@/lib/i18n/useDirection'

interface BalanceCardsProps {
  totalIncome: number
  totalExpense: number
  balance: number
  fetching?: boolean
}

/** One stat tile: a label and a large proportional-figure value. */
function StatTile({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Wallet }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <div className="rounded-full bg-muted p-2.5">
          <Icon className="size-5 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="truncate text-2xl font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

/** KPI row: the balance as the single hero figure plus income and expense stat tiles. */
export function BalanceCards({ totalIncome, totalExpense, balance, fetching }: BalanceCardsProps) {
  const { t } = useTranslation()
  const locale = useLocale()
  const positive = balance >= 0
  return (
    <div className={cn('grid gap-4 md:grid-cols-3 transition-opacity', fetching && 'opacity-50')}>
      <Card className="md:col-span-1 md:row-span-2">
        <CardContent className="flex h-full flex-col justify-center gap-1">
          <p className="text-sm text-muted-foreground">{t('dashboard.balance')}</p>
          <p className="text-4xl font-semibold tracking-tight sm:text-5xl">{formatMoney(balance, locale)}</p>
          <p className={cn('mt-1 inline-flex items-center gap-1 text-sm', positive ? 'text-emerald-700' : 'text-rose-700')}>
            {positive ? <ArrowUpRight className="size-4" /> : <ArrowDownRight className="size-4" />}
            {positive ? t('common.income') : t('common.expense')} &gt; {positive ? t('common.expense') : t('common.income')}
          </p>
        </CardContent>
      </Card>
      <div className="grid gap-4 md:col-span-2 sm:grid-cols-2">
        <StatTile label={t('dashboard.totalIncome')} value={formatMoney(totalIncome, locale)} icon={ArrowUpRight} />
        <StatTile label={t('dashboard.totalExpense')} value={formatMoney(totalExpense, locale)} icon={ArrowDownRight} />
      </div>
    </div>
  )
}
