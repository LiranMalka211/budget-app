import type { ColumnMapping, ImportSource } from '@/types'

/** Header keywords (lower-cased, English and Hebrew) that identify each transaction field. */
export const HEADER_KEYWORDS: Record<keyof ColumnMapping, string[]> = {
  date: ['date', 'תאריך', 'תאריך עסקה', 'תאריך חיוב', 'מועד'],
  title: ['description', 'details', 'name', 'merchant', 'beneficiary', 'payee', 'תיאור', 'פרטים', 'שם בית עסק', 'בית עסק', 'שם העסק', 'שם המוטב', 'הפעולה', 'פעולה'],
  amount: ['amount', 'sum', 'total', 'סכום', 'סכום חיוב', 'סכום העסקה', 'סכום בש"ח'],
  debit: ['debit', 'withdrawal', 'חובה', 'משיכה', 'יצא'],
  credit: ['credit', 'deposit', 'זכות', 'הפקדה', 'נכנס'],
}

/** Returns the header that best matches a field's keywords, preferring exact matches over partial ones. */
function findHeader(headers: string[], keywords: string[], exclude: Set<string>): string | null {
  const lower = headers.map((h) => h.toLowerCase())
  for (const kw of keywords) {
    const exact = lower.findIndex((h, i) => h === kw && !exclude.has(headers[i]))
    if (exact >= 0) return headers[exact]
  }
  for (const kw of keywords) {
    const partial = lower.findIndex((h, i) => h.includes(kw) && !exclude.has(headers[i]))
    if (partial >= 0) return headers[partial]
  }
  return null
}

/**
 * Guesses which column holds which field from the header names.
 * Credit-card exports usually have one amount column; bank statements often split debit and credit.
 */
export function guessMapping(headers: string[], source: ImportSource): ColumnMapping {
  const used = new Set<string>()
  const take = (field: keyof ColumnMapping) => {
    const h = findHeader(headers, HEADER_KEYWORDS[field], used)
    if (h) used.add(h)
    return h
  }
  const date = take('date')
  const title = take('title')
  let debit: string | null = null
  let credit: string | null = null
  let amount: string | null = null
  if (source !== 'credit') {
    debit = take('debit')
    credit = take('credit')
  }
  if (!debit || !credit) {
    amount = take('amount')
    if (amount) {
      debit = null
      credit = null
    }
  }
  return { date, title, amount, debit, credit }
}

/** One signed amount column, or separate debit (חובה) / credit (זכות) columns. */
export type AmountMode = 'single' | 'split'

/** The amount mode that fits a mapping, e.g. one produced by guessMapping. */
export function modeFor(mapping: ColumnMapping): AmountMode {
  return !mapping.amount && (mapping.debit || mapping.credit) ? 'split' : 'single'
}
