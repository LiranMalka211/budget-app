import { Check, Crown, KeyRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { BalanceCards } from '@/features/dashboard/components/BalanceCards'
import { DEMO_TOTALS } from './demoData'
import { Section, SectionHead } from './ui'

const MEMBERS = [
  { name: 'Dana Cohen', initials: 'DC', role: 'head' },
  { name: 'Yossi Cohen', initials: 'YC', role: 'member' },
  { name: 'Noa Levi', initials: 'NL', role: 'pending' },
] as const

/** bento: the family's shared balance large, beside the members list, the invite key and who added what. */
export function FamilySection() {
  const { t } = useTranslation()
  return (
    <Section id="family" hm={2}>
      <SectionHead id="family" title={t('landing.family.h2')} lead={t('landing.family.lead')} />
      <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-12">
        <div data-ui role="img" aria-label={t('dashboard.balance')} className="md:col-span-2 xl:col-span-8">
          <BalanceCards totalIncome={DEMO_TOTALS.income} totalExpense={DEMO_TOTALS.expense} balance={DEMO_TOTALS.income - DEMO_TOTALS.expense} />
        </div>
        <article className="glow-card rounded-2xl bg-card p-5 xl:col-span-4">
          <h3 className="font-medium">{t('landing.family.membersTitle')}</h3>
          <ul data-ui className="mt-3 flex flex-col divide-y divide-border">
            {MEMBERS.map((m) => (
              <li key={m.name} className="flex items-center gap-3 py-2.5">
                <Avatar className="size-8">
                  <AvatarFallback className="bg-secondary text-xs font-semibold text-secondary-foreground">{m.initials}</AvatarFallback>
                </Avatar>
                <span className="flex-1 text-sm font-medium">{m.name}</span>
                <Badge variant={m.role === 'head' ? 'default' : m.role === 'pending' ? 'outline' : 'secondary'}>
                  {m.role === 'head' && <Crown className="size-3" aria-hidden />}
                  {t(`landing.family.${m.role}`)}
                </Badge>
              </li>
            ))}
          </ul>
        </article>
        <article className="glow-card rounded-2xl bg-card p-5 xl:col-span-4">
          <h3 className="flex items-center gap-2 font-medium">
            <KeyRound className="size-4 text-primary" aria-hidden /> {t('family.inviteKey')}
          </h3>
          <p data-ui className="mt-3 inline-flex h-11 items-center rounded-lg bg-muted px-4 font-mono text-lg tracking-widest" dir="ltr">
            K7PQ-3MZD
          </p>
          <p className="mt-2 text-sm text-muted-foreground">{t('family.inviteKeyHint')}</p>
        </article>
        <article className="glow-card rounded-2xl bg-card p-5 xl:col-span-4">
          <h3 className="font-medium">{t('landing.family.addedByTitle')}</h3>
          <ul data-ui className="mt-3 flex flex-col gap-2 text-sm">
            {[
              ['Rami Levy', 'Yossi'],
              ['Electricity & water', 'Dana'],
              ['Pizza night', 'Yossi'],
            ].map(([title, by]) => (
              <li key={title} className="flex items-center justify-between rounded-md bg-muted px-3 py-2">
                <span>{title}</span>
                <span className="text-xs text-muted-foreground">
                  {t('landing.family.addedBy')} {by}
                </span>
              </li>
            ))}
          </ul>
        </article>
        <article className="glow-card rounded-2xl bg-card p-5 xl:col-span-4">
          <h3 className="font-medium">{t('family.pending')}</h3>
          <div data-ui className="mt-3 flex items-center gap-3 rounded-md bg-muted px-3 py-2">
            <Avatar className="size-8">
              <AvatarFallback className="bg-secondary text-xs font-semibold text-secondary-foreground">NL</AvatarFallback>
            </Avatar>
            <span className="flex-1 text-sm font-medium">Noa Levi</span>
            <span className="inline-flex h-8 items-center gap-1 rounded-md bg-primary px-2.5 text-xs font-medium text-primary-foreground">
              <Check className="size-3.5" aria-hidden /> {t('family.approve')}
            </span>
          </div>
        </article>
      </div>
    </Section>
  )
}
