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

/**
 * The current calendar month against the savings goal (independent of the dashboard's range).
 * Scheduled payments still due this month are set aside in advance; scheduled income still due is counted in.
 */
export interface MonthBudget {
  /** YYYY-MM */
  month: string
  /** How much should be left at the end of the month; null when no goal is set. */
  goal: number | null
  /** Income received so far this month. */
  income: number
  /** Scheduled income still due this month. */
  expectedIncome: number
  /** Spent so far this month. */
  expense: number
  /** Scheduled expenses still due this month. */
  upcomingFixed: number
  /** income + expectedIncome - goal. */
  spendable: number
  /** spendable - expense - upcomingFixed; negative when the goal can no longer be met. */
  leftToSpend: number
}

/** Everything the dashboard renders, computed server-side for a date range. */
export interface DashboardSummary {
  from: string
  to: string
  totalIncome: number
  totalExpense: number
  /** Expenses created by scheduled payments in the range. */
  fixedExpense: number
  /** All other expenses in the range. */
  variableExpense: number
  balance: number
  byCategory: CategoryTotal[]
  byMonth: MonthlyTotal[]
  recentTransactions: Transaction[]
  upcomingScheduled: ScheduledTransaction[]
  /** The newest generation of insights, in every language. */
  latestInsights: AiInsight[]
  monthBudget: MonthBudget
}
