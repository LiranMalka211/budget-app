import { api } from '@/lib/api'

/** Typed wrappers around the dashboard endpoints. */
export const dashboardApi = {
  /** Loads totals, breakdowns and widgets for a date range. */
  summary: (from: string, to: string) => api.dashboard.summary(from, to),
  /** Sets (or with null removes) the monthly savings goal. */
  setSavingsGoal: (amount: number | null) => api.dashboard.setSavingsGoal(amount),
}
