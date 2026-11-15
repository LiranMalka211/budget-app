import { api } from '@/lib/api'
import type { TransactionFilters, TransactionInput } from '@/types'

/** Typed wrappers around the transaction endpoints. */
export const transactionsApi = {
  /** Lists transactions matching the filters, paged. */
  list: (filters: TransactionFilters) => api.transactions.list(filters),
  /** Creates a manual transaction. */
  create: (input: TransactionInput) => api.transactions.create(input),
  /** Updates an existing transaction. */
  update: (id: string, input: TransactionInput) => api.transactions.update(id, input),
  /** Deletes a transaction. */
  remove: (id: string) => api.transactions.remove(id),
}
