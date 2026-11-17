import { CalendarClock, FileUp, ReceiptText, Sparkles, type LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatDate } from '@/lib/format/dates'
import { useLocale } from '@/lib/i18n/useDirection'
import { Section, SectionHead } from './ui'

/** A card's small working visual: a few rows of the thing the feature handles. */
function Mini({ kind }: { kind: 'transactions' | 'scheduled' | 'import' | 'insights' }) {
  const { t } = useTranslation()
  const locale = useLocale()
  const row = (a: string, b: string, cls = '') => (
    <div className="flex items-center justify-between rounded-md bg-background px-3 py-1.5 text-xs">
      <span>{a}</span>
      <span className={`tabular-nums ${cls}`}>{b}</span>
    </div>
  )
  if (kind === 'transactions')
    return (
      <>
        {row('Rami Levy', '-₪275', 'text-expense')}
        {row('Salary', '+₪15,000', 'text-income')}
        {row('Fuel', '-₪289', 'text-expense')}
      </>
    )
  if (kind === 'scheduled')
    return (
      <>
        {row(`${t('categories.rent')} · ${t('scheduled.monthly')}`, formatDate('2026-12-01', locale))}
        {row(`${t('categories.salary')} · ${t('scheduled.monthly')}`, formatDate('2026-12-10', locale))}
        {row(`${t('categories.insurance')} · ${t('scheduled.yearly')}`, formatDate('2027-01-20', locale))}
      </>
    )
  if (kind === 'import')
    return (
      <>
        {row('statement-nov.xlsx', 'Excel')}
        {row('credit-card.csv', 'CSV')}
        {row('bank-export.xls', 'HTML')}
      </>
    )
  return (
    <div className="rounded-md bg-background p-3 text-xs leading-5 text-muted-foreground">
      <span className="font-medium text-foreground">{t('categories.dining')}</span> · {t('insights.title')}
      <span className="mt-1 block h-2 w-3/4 rounded bg-muted" />
      <span className="mt-1 block h-2 w-1/2 rounded bg-muted" />
    </div>
  )
}

const ITEMS: { key: 'transactions' | 'scheduled' | 'import' | 'insights'; icon: LucideIcon }[] = [
  { key: 'transactions', icon: ReceiptText },
  { key: 'scheduled', icon: CalendarClock },
  { key: 'import', icon: FileUp },
  { key: 'insights', icon: Sparkles },
]

/** features-2x2: four features of equal weight, each with a title, two lines and a small panel. */
export function Features() {
  const { t } = useTranslation()
  return (
    <Section id="features" hm={2}>
      <SectionHead id="features" title={t('landing.features.h2')} lead={t('landing.features.lead')} />
      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        {ITEMS.map(({ key, icon: Icon }) => (
          <article key={key} className="glow-card flex flex-col gap-3 rounded-2xl bg-card p-5">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground" aria-hidden>
                <Icon className="size-5" />
              </span>
              <h3 className="text-xl font-medium">{t(`landing.features.${key}Title`)}</h3>
            </div>
            <p className="leading-6 text-muted-foreground">{t(`landing.features.${key}Body`)}</p>
            <div data-ui className="mt-auto flex flex-col gap-1.5 rounded-xl bg-muted p-3">
              <Mini kind={key} />
            </div>
          </article>
        ))}
      </div>
    </Section>
  )
}
