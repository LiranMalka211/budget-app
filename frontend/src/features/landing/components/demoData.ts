/** Static rows for the landing page's app frame; category keys are the `categories.*` i18n keys of the built-in set. */
export interface DemoRow {
  id: string
  date: string
  title: string
  category: string
  amount: number
  income?: boolean
  by: string
  note?: string
}

export const DEMO_ROWS: DemoRow[] = [
  { id: 'r1', date: '2026-11-15', title: 'Netflix', category: 'entertainment', amount: 55, by: 'Yossi' },
  { id: 'r2', date: '2026-11-14', title: 'Rami Levy', category: 'groceries', amount: 275, by: 'Yossi', note: 'Weekly shop' },
  { id: 'r3', date: '2026-11-13', title: 'Cafe', category: 'dining', amount: 222, by: 'Dana' },
  { id: 'r4', date: '2026-11-12', title: 'Electricity & water', category: 'utilities', amount: 401, by: 'Dana' },
  { id: 'r5', date: '2026-11-10', title: 'Salary', category: 'salary', amount: 15000, income: true, by: 'Dana' },
  { id: 'r6', date: '2026-11-08', title: 'Fuel', category: 'transport', amount: 289, by: 'Yossi' },
  { id: 'r7', date: '2026-11-08', title: 'Victory', category: 'groceries', amount: 210, by: 'Dana' },
  { id: 'r8', date: '2026-11-05', title: 'Gym', category: 'health', amount: 150, by: 'Dana' },
  { id: 'r9', date: '2026-11-04', title: 'Pizza night', category: 'dining', amount: 155, by: 'Yossi' },
  { id: 'r10', date: '2026-11-02', title: 'Victory', category: 'groceries', amount: 256, by: 'Yossi' },
  { id: 'r11', date: '2026-11-01', title: 'Salary', category: 'salary', amount: 9000, income: true, by: 'Yossi' },
  { id: 'r12', date: '2026-11-01', title: 'Rent', category: 'rent', amount: 5200, by: 'Dana' },
]

/** The row the detail pane opens. */
export const DEMO_OPEN_ROW = DEMO_ROWS[1]

export const DEMO_TOTALS = { income: 24000, expense: 7213 }

/** Spending by category for the demo donut (largest first; sums to the expense total). */
export const DEMO_CATEGORIES: { key: string; total: number }[] = [
  { key: 'rent', total: 5200 },
  { key: 'groceries', total: 741 },
  { key: 'utilities', total: 401 },
  { key: 'dining', total: 377 },
  { key: 'transport', total: 289 },
  { key: 'otherExpense', total: 205 },
]

/** Six months of income vs expense for the demo bars. */
export const DEMO_MONTHS: { month: string; income: number; expense: number }[] = [
  { month: '2026-06', income: 24000, expense: 10400 },
  { month: '2026-07', income: 24000, expense: 10900 },
  { month: '2026-08', income: 24000, expense: 10100 },
  { month: '2026-09', income: 27500, expense: 9600 },
  { month: '2026-10', income: 24000, expense: 9900 },
  { month: '2026-11', income: 24000, expense: 7213 },
]
