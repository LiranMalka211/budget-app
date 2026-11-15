import { endOfMonth, endOfYear, startOfMonth, startOfYear, subMonths } from 'date-fns'
import { toIsoDate } from '@/lib/format/dates'

/** Keys of the date-range presets offered above the dashboard; labels live under `dashboard.ranges.*`. */
export type RangePreset = 'thisMonth' | 'lastMonth' | 'last3Months' | 'thisYear'

export const RANGE_PRESETS: RangePreset[] = ['thisMonth', 'lastMonth', 'last3Months', 'thisYear']

/** Converts a preset into concrete from/to ISO dates relative to today. */
export function presetToRange(preset: RangePreset, now: Date = new Date()): { from: string; to: string } {
  switch (preset) {
    case 'lastMonth': {
      const prev = subMonths(now, 1)
      return { from: toIsoDate(startOfMonth(prev)), to: toIsoDate(endOfMonth(prev)) }
    }
    case 'last3Months':
      return { from: toIsoDate(startOfMonth(subMonths(now, 2))), to: toIsoDate(endOfMonth(now)) }
    case 'thisYear':
      return { from: toIsoDate(startOfYear(now)), to: toIsoDate(endOfYear(now)) }
    default:
      return { from: toIsoDate(startOfMonth(now)), to: toIsoDate(endOfMonth(now)) }
  }
}
