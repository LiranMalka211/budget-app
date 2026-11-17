/** Part of the day a greeting is chosen for. */
export type DayPart = 'morning' | 'afternoon' | 'evening' | 'night'

/** Morning 5:00-11:59, afternoon 12:00-16:59, evening 17:00-20:59, night 21:00-4:59 (the user's local time). */
export function dayPart(hour: number): DayPart {
  if (hour >= 5 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 17) return 'afternoon'
  if (hour >= 17 && hour < 21) return 'evening'
  return 'night'
}
