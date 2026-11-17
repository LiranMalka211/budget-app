import { Loader2, Pencil, PiggyBank, Target } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { cn } from 'cn'
import { useApiErrorMessage } from '@/components/common/ErrorState'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCanEdit } from '@/hooks/useFamilyOverview'
import { formatMoney } from '@/lib/format/money'
import { useLocale } from '@/lib/i18n/useDirection'
import type { MonthBudget } from '@/types'
import { useSetSavingsGoal } from '../useDashboard'

/** Days left in the month, today included. */
function daysLeftInMonth(now = new Date()): number {
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  return last - now.getDate() + 1
}

/** Dialog that sets, changes or removes the monthly savings goal. */
function GoalDialog({ open, onOpenChange, current }: { open: boolean; onOpenChange: (o: boolean) => void; current: number | null }) {
  const { t } = useTranslation()
  const toMessage = useApiErrorMessage()
  const save = useSetSavingsGoal()
  const [value, setValue] = useState(current === null ? '' : String(current))
  const amount = Number(value)
  const valid = value.trim() !== '' && Number.isFinite(amount) && amount >= 0

  const submit = async (next: number | null) => {
    try {
      await save.mutateAsync(next)
      toast.success(next === null ? t('dashboard.goal.removed') : t('dashboard.goal.saved'))
      onOpenChange(false)
    } catch (err) {
      toast.error(toMessage(err))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('dashboard.goal.dialogTitle')}</DialogTitle>
          <DialogDescription>{t('dashboard.goal.dialogHint')}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="savings-goal">{t('dashboard.goal.amountLabel')}</Label>
          <Input
            id="savings-goal"
            type="number"
            inputMode="decimal"
            min={0}
            step="any"
            dir="ltr"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && valid && void submit(amount)}
            autoFocus
          />
        </div>
        <DialogFooter className="gap-2">
          {current !== null && (
            <Button variant="ghost" className="sm:me-auto" onClick={() => void submit(null)} disabled={save.isPending}>
              {t('dashboard.goal.remove')}
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={() => void submit(amount)} disabled={!valid || save.isPending}>
            {save.isPending && <Loader2 className="animate-spin" />}
            {t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * "Left to spend this month": what can still be spent while keeping the savings goal. The bar splits the month's
 * spendable money into spent, set aside for scheduled payments still due, and what is left.
 */
export function MonthBudgetCard({ budget }: { budget: MonthBudget }) {
  const { t } = useTranslation()
  const locale = useLocale()
  const canEdit = useCanEdit()
  const [dialogOpen, setDialogOpen] = useState(false)
  const money = (n: number) => formatMoney(n, locale, undefined, { maximumFractionDigits: 0 })
  const monthName = new Intl.DateTimeFormat(locale, { month: 'long' }).format(new Date(`${budget.month}-01T12:00:00`))

  const { goal, expense, upcomingFixed, leftToSpend, spendable } = budget
  const over = leftToSpend < 0
  const noIncome = budget.income + budget.expectedIncome === 0
  // Bar scale: the spendable money, or everything committed when that is larger (overspent).
  const scale = Math.max(spendable, expense + upcomingFixed, 1)
  const segments = [
    { key: 'spent', label: t('dashboard.goal.spent'), value: expense, className: 'bg-expense' },
    { key: 'reserved', label: t('dashboard.goal.reserved'), value: upcomingFixed, className: 'bg-expense/40' },
    { key: 'left', label: t('dashboard.goal.left'), value: Math.max(leftToSpend, 0), className: 'bg-income' },
  ]
  const perDay = leftToSpend > 0 ? leftToSpend / daysLeftInMonth() : 0

  const openDialog = () => setDialogOpen(true)

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PiggyBank className="size-4 text-primary" aria-hidden /> {t('dashboard.goal.title', { month: monthName })}
        </CardTitle>
        <CardDescription>
          {goal === null ? t('dashboard.goal.noGoalHint') : t('dashboard.goal.goalLine', { amount: money(goal) })}
        </CardDescription>
        {canEdit && goal !== null && (
          <CardAction>
            <Button variant="ghost" size="sm" onClick={openDialog}>
              <Pencil /> {t('dashboard.goal.edit')}
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {goal === null ? (
          canEdit ? (
            <Button onClick={openDialog} className="w-fit">
              <Target /> {t('dashboard.goal.set')}
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">{t('dashboard.goal.askHead')}</p>
          )
        ) : (
          <>
            <div>
              <p className={cn('text-3xl font-bold tracking-tight tabular-nums', over ? 'text-expense' : 'text-foreground')}>
                {money(over ? -leftToSpend : leftToSpend)}
              </p>
              <p className="text-sm text-muted-foreground">
                {over
                  ? t('dashboard.goal.overBy')
                  : perDay > 0
                    ? t('dashboard.goal.leftPerDay', { perDay: money(perDay) })
                    : t('dashboard.goal.leftLabel')}
              </p>
            </div>

            <div
              className="flex h-4 w-full overflow-hidden rounded-full bg-muted"
              role="img"
              aria-label={segments.map((s) => `${s.label}: ${money(s.value)}`).join(', ')}
            >
              {segments.map((s) =>
                s.value > 0 ? (
                  <div
                    key={s.key}
                    className={cn('h-full transition-[width] duration-500', s.className)}
                    style={{ width: `${Math.min(100, (s.value / scale) * 100)}%` }}
                  />
                ) : null,
              )}
            </div>

            <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
              {segments.map((s) => (
                <li key={s.key} className="flex items-center gap-1.5">
                  <span className={cn('size-2.5 rounded-full', s.className)} aria-hidden />
                  <span className="text-muted-foreground">{s.label}</span>
                  <span className="font-medium tabular-nums">{money(s.value)}</span>
                </li>
              ))}
            </ul>

            <p className="text-xs text-muted-foreground">
              {noIncome
                ? t('dashboard.goal.noIncomeYet')
                : t('dashboard.goal.incomeLine', {
                    income: money(budget.income),
                    expected: money(budget.expectedIncome),
                    count: budget.expectedIncome > 0 ? 1 : 0,
                  })}
            </p>
          </>
        )}
      </CardContent>
      {dialogOpen && <GoalDialog open={dialogOpen} onOpenChange={setDialogOpen} current={goal} />}
    </Card>
  )
}
