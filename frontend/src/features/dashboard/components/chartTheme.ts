/**
 * Chart colour roles. Series colours are the first two validated categorical slots of the
 * reference data-viz palette (adjacent-pair CVD ΔE and contrast checked against a white surface);
 * chrome colours are hairline greys so the data stays the loudest thing on the card.
 */
export const CHART = {
  /** Slot 1 (blue): income. */
  income: '#2a78d6',
  /** Slot 2 (orange): expense. */
  expense: '#eb6834',
  /** Single-hue colour for ranked magnitude bars. */
  magnitude: '#2a78d6',
  /** Categorical slots 1-5 in fixed order (theme tokens, so dark mode steps them); validated as a set. */
  categorical: ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'],
  /** Neutral for the folded "Other" part: a gray, never a sixth hue. */
  other: '#b8b7b0',
  grid: '#e1e0d9',
  axis: '#c3c2b7',
  tick: '#898781',
  /** Card surface; used for the 2px gap between pie slices. */
  surface: 'var(--card)',
} as const

/** Shared mark specs: bars no thicker than 24px, 4px rounded data-end, 2px surface gap between neighbours. */
export const MARK = {
  maxBarSize: 20,
  barGap: 2,
  columnRadius: [4, 4, 0, 0] as [number, number, number, number],
  horizontalRadius: [0, 4, 4, 0] as [number, number, number, number],
} as const

/** Compact currency for axis ticks (e.g. "₪12K"). */
export function compactCurrency(value: number, locale: string, currency = 'ILS'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}
