import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { TransactionFilters, TransactionInput } from '@/types'
import { transactionsApi } from './transactionsApi'

/** Query keys for transactions; the dashboard key is invalidated too because totals change. */
export const transactionKeys = {
  all: ['transactions'] as const,
  list: (filters: TransactionFilters) => ['transactions', 'list', filters] as const,
}

/** Loads a page of transactions for the given filters, keeping the previous page visible while fetching. */
export function useTransactionsList(filters: TransactionFilters) {
  return useQuery({
    queryKey: transactionKeys.list(filters),
    queryFn: () => transactionsApi.list(filters),
    placeholderData: keepPreviousData,
  })
}

/** Invalidates every query whose data depends on transactions. */
function useInvalidateTransactions() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: transactionKeys.all }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
    ])
}

/** Creates a transaction and refreshes lists and dashboard. */
export function useCreateTransaction() {
  const invalidate = useInvalidateTransactions()
  return useMutation({ mutationFn: (input: TransactionInput) => transactionsApi.create(input), onSuccess: invalidate })
}

/** Updates a transaction and refreshes lists and dashboard. */
export function useUpdateTransaction() {
  const invalidate = useInvalidateTransactions()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: TransactionInput }) => transactionsApi.update(id, input),
    onSuccess: invalidate,
  })
}

/** Deletes a transaction and refreshes lists and dashboard. */
export function useDeleteTransaction() {
  const invalidate = useInvalidateTransactions()
  return useMutation({ mutationFn: (id: string) => transactionsApi.remove(id), onSuccess: invalidate })
}
