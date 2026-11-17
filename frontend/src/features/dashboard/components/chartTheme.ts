/**
 * Chart colour roles, all as theme tokens so light and dark mode re-step them (see index.css).
 * Recharts writes them as SVG presentation attributes, where `var()` resolves like any other CSS.
 */
export const CHART = {
  income: 'var(--income)',
  expense: 'var(--expense)',
  /** Single-hue colour for ranked magnitude bars. */
  magnitude: 'var(--brand)',
  /** Categorical slots 1-5 in fixed order; validated as a set for each mode. */
  categorical: ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'],
  /** Neutral for the folded "Other" part: a gray, never a sixth hue. */
  other: 'var(--muted-foreground)',
  grid: 'var(--border)',
  axis: 'var(--border)',
  tick: 'var(--muted-foreground)',
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

/**
 * True on devices with a real hover (mouse, trackpad). On touch screens a tap fires a synthetic hover and then a
 * click, and scrolling over a chart counts as hovering it, so touch devices drive chart details by tap only.
 */
export const CAN_HOVER = typeof window !== 'undefined' && window.matchMedia?.('(hover: hover)').matches
