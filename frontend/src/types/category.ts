/** Kind of money movement. Mirrors the `transaction_types` table. */
export type TransactionTypeKey = 'income' | 'expense'

/** A transaction type row. */
export interface TransactionType {
  id: string
  type: TransactionTypeKey
}

/** A spending/income category. Mirrors the `categories` table. */
export interface Category {
  id: string
  name: string
  /** Type this category applies to, so income categories never show for expenses. */
  typeId: string
  /** Lucide icon name used for display only. */
  icon?: string
}

/** Payload for creating a custom category. */
export interface CreateCategoryInput {
  name: string
  typeId: string
}
