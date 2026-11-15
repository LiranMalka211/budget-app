import { ArrowDownRight, ArrowUpRight, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
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

/** One stat tile: a tinted icon badge, a label and a large tabular figure. */
function StatTile({ label, value, icon: Icon, tone }: { label: string; value: string; icon: typeof Wallet; tone: 'income' | 'expense' }) {
  return (
    <Card className="justify-center">
      <CardContent className="flex items-center gap-4">
        <div
          className={cn(
            'flex size-11 shrink-0 items-center justify-center rounded-xl',
            tone === 'income' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700',
          )}
          aria-hidden
        >
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="truncate text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

/** KPI row: the balance as the single hero figure (brand surface) plus income and expense stat tiles. */
export function BalanceCards({ totalIncome, totalExpense, balance, fetching }: BalanceCardsProps) {
  const { t } = useTranslation()
  const locale = useLocale()
  const positive = balance >= 0
  // Share of income that was not spent; only meaningful when there was income.
  const savedPct = totalIncome > 0 ? Math.round((balance / totalIncome) * 100) : null

  return (
    <div className={cn('grid gap-4 transition-opacity md:grid-cols-3', fetching && 'opacity-50')}>
      <Card className="relative bg-primary text-primary-foreground ring-0 md:col-span-1">
        {/* Decorative glow so the hero card has depth without a busy gradient. */}
        <div
          className="pointer-events-none absolute -end-16 -top-20 size-56 rounded-full bg-white/10 blur-2xl"
          aria-hidden
        />
        <CardContent className="relative flex h-full flex-col justify-center gap-1">
          <p className="flex items-center gap-2 text-sm text-primary-foreground/80">
            <Wallet className="size-4" aria-hidden /> {t('dashboard.balance')}
          </p>
          <p className="text-4xl font-bold tracking-tight tabular-nums sm:text-[2.75rem]">{formatMoney(balance, locale)}</p>
          {savedPct !== null && (
            <p className="mt-2 inline-flex w-fit items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium">
              {positive ? <TrendingUp className="size-3.5" aria-hidden /> : <TrendingDown className="size-3.5" aria-hidden />}
              {positive ? t('dashboard.savedShare', { pct: savedPct }) : t('dashboard.overspent')}
            </p>
          )}
        </CardContent>
      </Card>
      <div className="grid gap-4 sm:grid-cols-2 md:col-span-2">
        <StatTile label={t('dashboard.totalIncome')} value={formatMoney(totalIncome, locale)} icon={ArrowUpRight} tone="income" />
        <StatTile label={t('dashboard.totalExpense')} value={formatMoney(totalExpense, locale)} icon={ArrowDownRight} tone="expense" />
      </div>
    </div>
  )
}
