import { api } from '@/lib/api'

/** Typed wrappers around the AI insight endpoints. */
export const insightsApi = {
  /** Lists stored insights, newest first. */
  list: () => api.insights.list(),
  /** Asks the backend to analyse the budget and store new insights. */
  generate: () => api.insights.generate(),
}
