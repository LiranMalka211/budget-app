import { addMonths, addWeeks, addYears, isAfter, isBefore, parseISO, setDate } from 'date-fns'
import type { ScheduledTransaction, Transaction } from '@/types'
import { toIsoDate } from '@/lib/format/dates'
import { newId } from '@/lib/utils/id'

/** Computes the run date that follows `current` for a schedule. */
export function nextRunAfter(current: string, schedule: Pick<ScheduledTransaction, 'interval' | 'dayOfMonth'>): string {
  const d = parseISO(current)
  let next: Date
  switch (schedule.interval) {
    case 'weekly':
      next = addWeeks(d, 1)
      break
    case 'yearly':
      next = addYears(d, 1)
      break
    default:
      next = addMonths(d, 1)
  }
  if (schedule.dayOfMonth && schedule.interval !== 'weekly') {
    next = setDate(next, Math.min(schedule.dayOfMonth, 28))
  }
  return toIsoDate(next)
}

/** Computes the first run date for a brand-new schedule based on its start date and day of month. */
export function firstRunDate(input: Pick<ScheduledTransaction, 'interval' | 'dayOfMonth' | 'startDate'>): string {
  const start = parseISO(input.startDate)
  if (input.dayOfMonth && input.interval !== 'weekly') {
    const candidate = setDate(start, Math.min(input.dayOfMonth, 28))
    return toIsoDate(isBefore(candidate, start) ? addMonths(candidate, 1) : candidate)
  }
  return input.startDate
}

/**
 * Generates transactions for every schedule whose nextRunDate is on or before today,
 * advancing nextRunDate until it is in the future. Mutates the schedules and returns the new transactions.
 * The real backend will do this in a daily cron job.
 */
export function materializeDueSchedules(
  schedules: ScheduledTransaction[],
  today: string = toIsoDate(new Date()),
): Transaction[] {
  const created: Transaction[] = []
  const todayDate = parseISO(today)
  for (const s of schedules) {
    if (!s.isActive) continue
    let guard = 0
    while (!isAfter(parseISO(s.nextRunDate), todayDate) && guard < 120) {
      guard += 1
      if (s.endDate && isAfter(parseISO(s.nextRunDate), parseISO(s.endDate))) {
        s.isActive = false
        break
      }
      created.push({
        id: newId('tx'),
        date: s.nextRunDate,
        title: s.title,
        amount: s.amount,
        userId: s.userId,
        categoryId: s.categoryId,
        typeId: s.typeId,
        familyId: s.familyId,
        source: 'scheduled',
        createdAt: new Date().toISOString(),
      })
      s.nextRunDate = nextRunAfter(s.nextRunDate, s)
    }
  }
  return created
}
