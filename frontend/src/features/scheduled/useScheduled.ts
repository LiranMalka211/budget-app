import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ScheduledTransactionInput } from '@/types'
import { scheduledApi } from './scheduledApi'

/** Query key for the scheduled list. */
export const scheduledKeys = {
  all: ['scheduled'] as const,
}

/** Loads all scheduled transactions. */
export function useScheduledList() {
  return useQuery({ queryKey: scheduledKeys.all, queryFn: scheduledApi.list })
}

/** Invalidates scheduled, transactions and dashboard queries after a change. */
function useInvalidateScheduled() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: scheduledKeys.all }),
      queryClient.invalidateQueries({ queryKey: ['transactions'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
    ])
}

/** Creates a scheduled transaction. */
export function useCreateScheduled() {
  const invalidate = useInvalidateScheduled()
  return useMutation({ mutationFn: (input: ScheduledTransactionInput) => scheduledApi.create(input), onSuccess: invalidate })
}

/** Updates a scheduled transaction. */
export function useUpdateScheduled() {
  const invalidate = useInvalidateScheduled()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ScheduledTransactionInput }) => scheduledApi.update(id, input),
    onSuccess: invalidate,
  })
}

/** Deletes a scheduled transaction. */
export function useDeleteScheduled() {
  const invalidate = useInvalidateScheduled()
  return useMutation({ mutationFn: (id: string) => scheduledApi.remove(id), onSuccess: invalidate })
}

/** Pauses or resumes a scheduled transaction. */
export function useToggleScheduled() {
  const invalidate = useInvalidateScheduled()
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => scheduledApi.toggle(id, isActive),
    onSuccess: invalidate,
  })
}
