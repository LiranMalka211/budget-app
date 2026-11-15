import { api } from '@/lib/api'
import type { ScheduledTransactionInput } from '@/types'

/** Typed wrappers around the scheduled-transaction endpoints. */
export const scheduledApi = {
  /** Lists all recurring templates visible to the user. */
  list: () => api.scheduled.list(),
  /** Creates a recurring template. */
  create: (input: ScheduledTransactionInput) => api.scheduled.create(input),
  /** Updates a recurring template. */
  update: (id: string, input: ScheduledTransactionInput) => api.scheduled.update(id, input),
  /** Deletes a recurring template (generated transactions are kept). */
  remove: (id: string) => api.scheduled.remove(id),
  /** Pauses or resumes a template. */
  toggle: (id: string, isActive: boolean) => api.scheduled.toggle(id, isActive),
}
