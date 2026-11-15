import type { TransactionTypeKey } from './category'

/** Which institution a file came from; drives column guessing. */
export type ImportSource = 'bank' | 'credit' | 'other'

/** A raw parsed row: header name -> cell value. */
export type RawRow = Record<string, string | number | null>

/** Which raw columns map to which transaction fields. */
export interface ColumnMapping {
  date: string | null
  title: string | null
  /** Single signed amount column, or null when debit/credit are split. */
  amount: string | null
  debit: string | null
  credit: string | null
}

/** A row after mapping, ready for review and commit. */
export interface NormalizedRow {
  /** Stable key for the row within the preview. */
  key: string
  date: string
  title: string
  amount: number
  type: TransactionTypeKey
  categoryId: string | null
  /** True when the row could not be parsed and should be skipped. */
  invalid?: boolean
  error?: string
}

/** One reviewed row as sent to the server. */
export interface CommitImportRow {
  date: string
  title: string
  amount: number
  type: TransactionTypeKey
  categoryId: string
}

/** Payload sent to the server to persist a reviewed import. */
export interface CommitImportInput {
  fileName: string
  source: ImportSource
  rows: CommitImportRow[]
}

/** Result of committing an import. */
export interface ImportResult {
  batchId: string
  inserted: number
  skippedDuplicates: number
}

/** Record of a past import. Mirrors the `import_batches` table. */
export interface ImportBatch {
  id: string
  fileName: string
  source: ImportSource
  rowCount: number
  createdAt: string
}
