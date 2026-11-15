import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { insightsApi } from './insightsApi'

/** Query key for insights. */
export const insightKeys = {
  all: ['insights'] as const,
}

/** Loads stored insights. */
export function useInsightsList() {
  return useQuery({ queryKey: insightKeys.all, queryFn: insightsApi.list })
}

/** Generates new insights and refreshes the list and dashboard teaser. */
export function useGenerateInsights() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => insightsApi.generate(),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: insightKeys.all }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ]),
  })
}
