import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { CommitImportInput } from '@/types'
import { importsApi } from './importsApi'

/** Commits an import and refreshes transactions and the dashboard. */
export function useCommitImport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CommitImportInput) => importsApi.commit(input),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['transactions'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ]),
  })
}
