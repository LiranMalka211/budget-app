import type { AiInsight } from './insight'
import type { ScheduledTransaction } from './scheduled'
import type { Transaction } from './transaction'

/** Spending total for a single category. */
export interface CategoryTotal {
  categoryId: string
  categoryName: string
  total: number
}

/** Income and expense totals for one calendar month. */
export interface MonthlyTotal {
  /** YYYY-MM */
  month: string
  income: number
  expense: number
}

/** Everything the dashboard renders, computed server-side for a date range. */
export interface DashboardSummary {
  from: string
  to: string
  totalIncome: number
  totalExpense: number
  balance: number
  byCategory: CategoryTotal[]
  byMonth: MonthlyTotal[]
  recentTransactions: Transaction[]
  upcomingScheduled: ScheduledTransaction[]
  latestInsight: AiInsight | null
}
