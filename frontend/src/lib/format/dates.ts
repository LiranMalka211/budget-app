import { endOfMonth, format, parse, parseISO, startOfMonth, isValid } from 'date-fns'

/** Canonical ISO date string (YYYY-MM-DD) used for all API payloads. */
export const ISO_DATE = 'yyyy-MM-dd'

/** Returns today's date as YYYY-MM-DD. */
export function todayIso(): string {
  return format(new Date(), ISO_DATE)
}

/** Converts a Date to YYYY-MM-DD. */
export function toIsoDate(date: Date): string {
  return format(date, ISO_DATE)
}

/** Parses a YYYY-MM-DD string into a Date (local time). */
export function fromIsoDate(iso: string): Date {
  return parseISO(iso)
}

/** Returns the first and last day of the month that contains `date`. */
export function monthRange(date: Date = new Date()): { from: string; to: string } {
  return { from: toIsoDate(startOfMonth(date)), to: toIsoDate(endOfMonth(date)) }
}

/** Formats an ISO date for display in the active locale (e.g. "15 Nov 2026"). */
export function formatDate(iso: string, locale: string): string {
  const d = fromIsoDate(iso)
  if (!isValid(d)) return iso
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(d)
}

/** Formats a YYYY-MM month key for chart axes (e.g. "Nov 26"). */
export function formatMonthLabel(month: string, locale: string): string {
  const d = parse(month, 'yyyy-MM', new Date())
  return new Intl.DateTimeFormat(locale, { month: 'short', year: '2-digit' }).format(d)
}

/** Common date layouts found in bank exports, tried in order when importing files. */
const IMPORT_DATE_FORMATS = ['dd/MM/yyyy', 'dd.MM.yyyy', 'dd-MM-yyyy', 'yyyy-MM-dd', 'dd/MM/yy', 'MM/dd/yyyy']

/** Tries to parse a bank-exported date cell into YYYY-MM-DD; returns null when no format matches. */
export function parseImportDate(raw: string | number | null | undefined): string | null {
  if (raw === null || raw === undefined) return null
  if (typeof raw === 'number') {
    // Excel serial date number.
    const ms = Math.round((raw - 25569) * 86400 * 1000)
    const d = new Date(ms)
    return isValid(d) ? toIsoDate(d) : null
  }
  const s = raw.trim()
  if (!s) return null
  for (const f of IMPORT_DATE_FORMATS) {
    const d = parse(s, f, new Date())
    if (isValid(d)) return toIsoDate(d)
  }
  const iso = parseISO(s)
  return isValid(iso) ? toIsoDate(iso) : null
}
