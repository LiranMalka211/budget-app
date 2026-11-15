import { api } from '@/lib/api'
import type { CommitImportInput } from '@/types'

/** Typed wrappers around the import endpoints. */
export const importsApi = {
  /** Persists reviewed rows; the server skips duplicates and reports counts. */
  commit: (input: CommitImportInput) => api.imports.commit(input),
}
