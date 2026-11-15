/** How often a scheduled transaction repeats. */
export type RecurrenceInterval = 'weekly' | 'monthly' | 'yearly'

/** A recurring transaction template. Mirrors the `scheduled_transactions` table. */
export interface ScheduledTransaction {
  id: string
  title: string
  amount: number
  categoryId: string
  typeId: string
  userId: string
  familyId: string | null
  interval: RecurrenceInterval
  /** Day of month for monthly/yearly schedules (1-31). */
  dayOfMonth?: number
  startDate: string
  endDate?: string | null
  /** Next date a transaction will be generated from this template. */
  nextRunDate: string
  isActive: boolean
  createdAt: string
}

/** Payload for creating or updating a scheduled transaction. */
export interface ScheduledTransactionInput {
  title: string
  amount: number
  categoryId: string
  typeId: string
  interval: RecurrenceInterval
  dayOfMonth?: number
  startDate: string
  endDate?: string | null
}
