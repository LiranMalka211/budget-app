import { api } from '@/lib/api'

/** Typed wrapper around the dashboard summary endpoint. */
export const dashboardApi = {
  /** Loads totals, breakdowns and widgets for a date range. */
  summary: (from: string, to: string) => api.dashboard.summary(from, to),
}
