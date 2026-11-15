/** Where a transaction came from. */
export type TransactionSource = 'manual' | 'scheduled' | 'import'

/** A single income or expense. Mirrors the `transactions` table. */
export interface Transaction {
  id: string
  /** ISO date (YYYY-MM-DD). */
  date: string
  title: string
  /** Always positive; the type decides the sign. */
  amount: number
  /** User who uploaded it. */
  userId: string
  categoryId: string
  typeId: string
  familyId: string | null
  source: TransactionSource
  note?: string
  createdAt: string
}

/** Payload for creating or updating a transaction. */
export interface TransactionInput {
  date: string
  title: string
  amount: number
  categoryId: string
  typeId: string
  note?: string
}

/** Query parameters accepted by the transactions list endpoint. */
export interface TransactionFilters {
  from?: string
  to?: string
  typeId?: string
  categoryId?: string
  search?: string
  page?: number
  pageSize?: number
}

/** Paged list response. */
export interface Paged<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}
