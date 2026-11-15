import { parseImportDate } from '@/lib/format/dates'
import { parseAmount } from '@/lib/format/money'
import type { ColumnMapping, ImportSource, NormalizedRow, RawRow } from '@/types'

/**
 * Converts raw file rows into transaction candidates using the chosen column mapping.
 * Sign rules: with split columns, debit = expense and credit = income. With a single column,
 * bank files treat negatives as expenses, while credit-card files list charges as positives.
 */
export function normalizeRows(rows: RawRow[], mapping: ColumnMapping, source: ImportSource): NormalizedRow[] {
  return rows.map((raw, index) => {
    const key = `row_${index}`
    const date = mapping.date ? parseImportDate(raw[mapping.date]) : null
    const title = mapping.title ? String(raw[mapping.title] ?? '').trim() : ''

    let signed: number | null = null
    if (mapping.amount) {
      const value = parseAmount(raw[mapping.amount])
      if (value !== null) signed = source === 'credit' ? -value : value
    } else {
      const debit = mapping.debit ? parseAmount(raw[mapping.debit]) : null
      const credit = mapping.credit ? parseAmount(raw[mapping.credit]) : null
      if (debit && debit !== 0) signed = -Math.abs(debit)
      else if (credit && credit !== 0) signed = Math.abs(credit)
    }

    if (!date || !title || signed === null || signed === 0) {
      return {
        key,
        date: date ?? '',
        title,
        amount: signed ? Math.abs(signed) : 0,
        type: 'expense',
        categoryId: null,
        invalid: true,
        error: !date ? 'date' : !title ? 'title' : 'amount',
      }
    }

    return {
      key,
      date,
      title,
      amount: Math.abs(signed),
      type: signed < 0 ? 'expense' : 'income',
      categoryId: null,
    }
  })
}
