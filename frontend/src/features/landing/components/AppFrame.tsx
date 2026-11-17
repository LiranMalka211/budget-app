import { ChevronDown, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from 'cn'
import { NAV_ITEMS } from '@/components/layout/navItems'
import { formatDate } from '@/lib/format/dates'
import { formatMoney } from '@/lib/format/money'
import { useLocale } from '@/lib/i18n/useDirection'
import { DEMO_CATEGORIES, DEMO_MONTHS, DEMO_OPEN_ROW, DEMO_ROWS, DEMO_TOTALS, type DemoRow } from './demoData'

export type AppView = 'list' | 'edit' | 'dashboard'

interface AppFrameProps {
  view: AppView
  /** Hero variant: the list alone, no side bar and no detail pane, so it fits a 628px frame. */
  compact?: boolean
  className?: string
}

const money = (n: number, locale: string) => formatMoney(n, locale, undefined, { maximumFractionDigits: 0 })

/** The app's own title bar: window dots, the app name and its search field. */
function TitleBar({ compact }: { compact?: boolean }) {
  const { t } = useTranslation()
  return (
    <div className="flex h-11 shrink-0 items-center gap-3 border-b border-border px-4">
      <span className="flex gap-1.5" aria-hidden>
        <i className="size-2.5 rounded-full bg-muted-foreground/30" />
        <i className="size-2.5 rounded-full bg-muted-foreground/30" />
        <i className="size-2.5 rounded-full bg-muted-foreground/30" />
      </span>
      <span className="text-sm font-semibold">{t('common.appName')}</span>
      {!compact && (
        <span className="ms-auto hidden h-7 w-56 items-center gap-2 rounded-md bg-muted px-2 text-xs text-muted-foreground sm:flex">
          <Search className="size-3.5" aria-hidden /> {t('transactions.searchPlaceholder')}
        </span>
      )}
    </div>
  )
}

/** The side bar with the app's real navigation words; the current page is highlighted. */
function SideBar({ active }: { active: string }) {
  const { t } = useTranslation()
  return (
    <aside className="hidden w-44 shrink-0 border-e border-border py-3 md:block">
      {NAV_ITEMS.map((item) => (
        <div
          key={item.path}
          className={cn(
            'mx-2 flex h-9 items-center gap-2.5 rounded-md px-2.5 text-[13px] font-medium',
            item.labelKey === active ? 'bg-sidebar-accent text-sidebar-accent-foreground [&>svg]:text-sidebar-primary' : 'text-muted-foreground',
          )}
        >
          <item.icon className="size-4" aria-hidden />
          {t(item.labelKey)}
        </div>
      ))}
    </aside>
  )
}

function CategoryChip({ name, editing }: { name: string; editing?: boolean }) {
  return editing ? (
    <span className="inline-flex h-8 w-full max-w-36 items-center justify-between rounded-md border border-input bg-background px-2.5 text-xs">
      {name} <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden />
    </span>
  ) : (
    <span className="text-muted-foreground">{name}</span>
  )
}

/** The transactions table: 12 rows that run past the frame's bottom; in edit mode category, amount and note are fields. */
function Rows({ editing, compact }: { editing: boolean; compact?: boolean }) {
  const { t } = useTranslation()
  const locale = useLocale()
  const changed = new Set(['r2', 'r6'])
  return (
    <table className="w-full text-[13px]">
      <thead className="text-start text-xs text-muted-foreground">
        <tr className="border-b border-border">
          <th className="hidden px-3 py-2 text-start font-medium sm:table-cell">{t('common.date')}</th>
          <th className="px-3 py-2 text-start font-medium">{t('common.title')}</th>
          <th className="hidden px-3 py-2 text-start font-medium sm:table-cell">{t('common.category')}</th>
          {!compact && <th className="hidden px-3 py-2 text-start font-medium md:table-cell">{t('transactions.uploadedBy')}</th>}
          <th className="px-3 py-2 text-end font-medium">{t('common.amount')}</th>
          {editing && <th className="px-3 py-2 text-start font-medium">{t('common.note')}</th>}
        </tr>
      </thead>
      <tbody>
        {DEMO_ROWS.map((r: DemoRow) => (
          <tr key={r.id} className={cn('border-b border-border/70', editing && changed.has(r.id) && 'bg-accent/50')}>
            <td className="hidden whitespace-nowrap px-3 py-2 text-muted-foreground sm:table-cell">{formatDate(r.date, locale)}</td>
            <td className="px-3 py-2 font-medium">{r.title}</td>
            <td className="hidden px-3 py-2 sm:table-cell">
              <CategoryChip name={t(`categories.${r.category}`)} editing={editing} />
            </td>
            {!compact && <td className="hidden px-3 py-2 text-muted-foreground md:table-cell">{r.by}</td>}
            <td className={cn('whitespace-nowrap px-3 py-2 text-end font-medium tabular-nums', r.income ? 'text-income' : 'text-expense')}>
              {editing ? (
                <span className="inline-flex h-8 w-24 items-center justify-end rounded-md border border-input bg-background px-2" dir="ltr">
                  {r.amount}
                </span>
              ) : (
                `${r.income ? '+' : '-'}${money(r.amount, locale)}`
              )}
            </td>
            {editing && (
              <td className="px-3 py-2">
                <span className="inline-flex h-8 w-full min-w-32 items-center rounded-md border border-input bg-background px-2 text-muted-foreground">
                  {r.note ?? ''}
                </span>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/** The open transaction beside the list: its fields as the app shows them. */
function Detail() {
  const { t } = useTranslation()
  const locale = useLocale()
  const r = DEMO_OPEN_ROW
  const field = (label: string, value: string) => (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="flex h-9 items-center rounded-md border border-input bg-background px-3 text-sm">{value}</span>
    </div>
  )
  return (
    <aside className="hidden w-80 shrink-0 flex-col gap-4 border-s border-border p-4 lg:flex">
      <div>
        <p className="text-sm text-muted-foreground">{formatDate(r.date, locale)}</p>
        <p className="text-lg font-semibold">{r.title}</p>
        <p className="text-2xl font-semibold tabular-nums text-expense">-{money(r.amount, locale)}</p>
      </div>
      {field(t('common.category'), t(`categories.${r.category}`))}
      {field(t('common.amount'), String(r.amount))}
      {field(t('common.note'), r.note ?? '')}
      <p className="text-xs text-muted-foreground">
        {t('transactions.uploadedBy')}: {r.by}
      </p>
      <div className="mt-auto flex gap-2">
        <span className="inline-flex h-9 flex-1 items-center justify-center rounded-md bg-primary text-sm font-medium text-primary-foreground">{t('common.save')}</span>
        <span className="inline-flex h-9 items-center justify-center rounded-md border border-border px-3 text-sm font-medium">{t('common.cancel')}</span>
      </div>
    </aside>
  )
}

/** Spending by category as a donut: pure SVG so the landing page carries no chart library. */
function Donut() {
  const { t } = useTranslation()
  const locale = useLocale()
  const total = DEMO_CATEGORIES.reduce((s, c) => s + c.total, 0)
  const r = 54
  const c = 2 * Math.PI * r
  // Each arc starts where the previous ones end; computed up front so render stays pure.
  const starts = DEMO_CATEGORIES.map((_, i) => DEMO_CATEGORIES.slice(0, i).reduce((sum, x) => sum + (x.total / total) * c, 0))
  const colors = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)', 'var(--muted-foreground)']
  return (
    <div className="flex flex-wrap items-center gap-5">
      <svg viewBox="0 0 140 140" className="size-36 shrink-0" style={{ direction: 'ltr' }} role="img" aria-label={t('dashboard.byCategory')}>
        <g transform="rotate(-90 70 70)">
          {DEMO_CATEGORIES.map((cat, i) => {
            const len = (cat.total / total) * c
            return (
              <circle
                key={cat.key}
                cx="70"
                cy="70"
                r={r}
                fill="none"
                stroke={colors[i]}
                strokeWidth="18"
                strokeDasharray={`${Math.max(len - 2, 0)} ${c - Math.max(len - 2, 0)}`}
                strokeDashoffset={-starts[i]}
              />
            )
          })}
        </g>
        <text x="70" y="66" textAnchor="middle" className="fill-muted-foreground text-[9px]">
          {t('dashboard.totalSpent')}
        </text>
        <text x="70" y="82" textAnchor="middle" className="fill-foreground text-[13px] font-semibold">
          {money(total, locale)}
        </text>
      </svg>
      <ul className="flex min-w-36 flex-1 flex-col gap-1 text-xs">
        {DEMO_CATEGORIES.slice(0, 5).map((cat, i) => (
          <li key={cat.key} className="flex items-center gap-2">
            <span className="size-2 rounded-full" style={{ background: colors[i] }} aria-hidden />
            <span className="min-w-0 flex-1">{t(`categories.${cat.key}`)}</span>
            <span className="text-muted-foreground tabular-nums">{Math.round((cat.total / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Income against expense by month as paired columns. */
function Bars() {
  const { t } = useTranslation()
  const max = Math.max(...DEMO_MONTHS.map((m) => m.income))
  return (
    <div>
      <div className="mb-2 flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <i className="size-2 rounded-[2px] bg-income" /> {t('common.income')}
        </span>
        <span className="flex items-center gap-1.5">
          <i className="size-2 rounded-[2px] bg-expense" /> {t('common.expense')}
        </span>
      </div>
      <svg viewBox="0 0 300 120" className="h-32 w-full" style={{ direction: 'ltr' }} role="img" aria-label={t('dashboard.cashflow')}>
        {[0, 1, 2, 3].map((i) => (
          <line key={i} x1="0" x2="300" y1={10 + i * 33} y2={10 + i * 33} stroke="var(--border)" />
        ))}
        {DEMO_MONTHS.map((m, i) => {
          const x = 14 + i * 48
          const hi = (m.income / max) * 100
          const he = (m.expense / max) * 100
          return (
            <g key={m.month}>
              <rect x={x} y={110 - hi} width="14" height={hi} rx="3" fill="var(--income)" />
              <rect x={x + 17} y={110 - he} width="14" height={he} rx="3" fill="var(--expense)" />
            </g>
          )
        })}
      </svg>
    </div>
  )
}

/** The dashboard as the app draws it: the balance tile, the donut and the monthly bars. */
function Dashboard() {
  const { t } = useTranslation()
  const locale = useLocale()
  const balance = DEMO_TOTALS.income - DEMO_TOTALS.expense
  return (
    <div className="grid gap-4 p-4 md:grid-cols-3">
      <div className="rounded-xl bg-primary p-4 text-primary-foreground">
        <p className="text-xs opacity-80">{t('dashboard.balance')}</p>
        <p className="text-3xl font-semibold tabular-nums">{money(balance, locale)}</p>
        <p className="mt-2 text-xs opacity-90">{t('dashboard.savedShare', { pct: Math.round((balance / DEMO_TOTALS.income) * 100) })}</p>
      </div>
      <div className="rounded-xl border border-border p-4">
        <p className="text-xs text-muted-foreground">{t('dashboard.totalIncome')}</p>
        <p className="text-2xl font-semibold tabular-nums">{money(DEMO_TOTALS.income, locale)}</p>
      </div>
      <div className="rounded-xl border border-border p-4">
        <p className="text-xs text-muted-foreground">{t('dashboard.totalExpense')}</p>
        <p className="text-2xl font-semibold tabular-nums">{money(DEMO_TOTALS.expense, locale)}</p>
      </div>
      <div className="rounded-xl border border-border p-4 md:col-span-2">
        <p className="mb-3 text-sm font-medium">{t('dashboard.byCategory')}</p>
        <Donut />
      </div>
      <div className="rounded-xl border border-border p-4">
        <p className="mb-3 text-sm font-medium">{t('dashboard.cashflow')}</p>
        <Bars />
      </div>
    </div>
  )
}

/**
 * One real app window: the side bar, the transactions list and, beside it, the open transaction.
 * `view` swaps the main pane between the list, the inline edit mode and the dashboard.
 */
export function AppFrame({ view, compact, className }: AppFrameProps) {
  const { t } = useTranslation()
  const label = view === 'dashboard' ? t('nav.dashboard') : t('nav.transactions')
  const active = view === 'dashboard' ? 'nav.dashboard' : 'nav.transactions'
  return (
    <div data-visual role="img" aria-label={`${t('common.appName')}: ${label}`} className={cn('app-window flex h-full flex-col text-foreground', className)}>
      <TitleBar compact={compact} />
      <div className="flex min-h-0 flex-1">
        {!compact && <SideBar active={active} />}
        <div key={view} className="settle flex min-h-0 flex-1 flex-col">
          {view === 'dashboard' ? (
            <Dashboard />
          ) : (
            <div className="flex min-h-0 flex-1">
              <div className={cn('min-w-0 flex-1 overflow-hidden', compact && 'pe-12')}>
                {view === 'edit' && (
                  <div className="flex items-center gap-2 border-b border-border px-3 py-2 text-xs">
                    <span className="rounded-md bg-accent px-2 py-1 text-accent-foreground">{t('transactions.unsavedHint', { count: 2 })}</span>
                    <span className="ms-auto inline-flex h-8 items-center rounded-md bg-primary px-3 font-medium text-primary-foreground">
                      {t('transactions.saveChanges', { count: 2 })}
                    </span>
                  </div>
                )}
                <Rows editing={view === 'edit'} compact={compact} />
              </div>
              {view === 'list' && !compact && <Detail />}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
