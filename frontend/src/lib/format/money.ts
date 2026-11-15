/** Default currency for the app; Israeli new shekel. */
export const DEFAULT_CURRENCY = 'ILS'

/** Formats a number as currency using the active locale (e.g. "₪1,250.00"). */
export function formatMoney(
  amount: number,
  locale: string,
  currency: string = DEFAULT_CURRENCY,
  options: Intl.NumberFormatOptions = {},
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
    ...options,
  }).format(amount)
}

/** Formats a signed amount with an explicit +/- prefix for income/expense lists. */
export function formatSignedMoney(
  amount: number,
  isIncome: boolean,
  locale: string,
  currency: string = DEFAULT_CURRENCY,
): string {
  const sign = isIncome ? '+' : '-'
  return `${sign}${formatMoney(Math.abs(amount), locale, currency)}`
}

/** Parses a user-typed or bank-exported amount string ("1,250.50", "₪ -300", "(120)") into a number. */
export function parseAmount(raw: string | number | null | undefined): number | null {
  if (raw === null || raw === undefined) return null
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null
  let s = raw.trim()
  if (!s) return null
  const negativeByParens = /^\(.*\)$/.test(s)
  s = s.replace(/[^\d.,-]/g, '')
  // Treat comma as thousands separator when a dot is also present, otherwise as decimal.
  if (s.includes(',') && s.includes('.')) s = s.replace(/,/g, '')
  else if (s.includes(',') && !s.includes('.')) {
    const parts = s.split(',')
    s = parts[parts.length - 1].length === 3 ? parts.join('') : parts.join('.')
  }
  const n = Number(s)
  if (!Number.isFinite(n)) return null
  return negativeByParens ? -Math.abs(n) : n
}
