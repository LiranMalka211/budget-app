import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { dashboardApi } from './dashboardApi'

/** Query key for the dashboard summary; other features invalidate `['dashboard']` when data changes. */
export const dashboardKeys = {
  summary: (from: string, to: string) => ['dashboard', 'summary', from, to] as const,
}

/** Loads the dashboard summary for a range, keeping the previous frame visible while refetching. */
export function useDashboardSummary(from: string, to: string) {
  return useQuery({
    queryKey: dashboardKeys.summary(from, to),
    queryFn: () => dashboardApi.summary(from, to),
    placeholderData: keepPreviousData,
  })
}
