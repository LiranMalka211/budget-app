import { FileSpreadsheet, LayoutDashboard, Tags, Upload, type LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Section } from './ui'

const NODES: { key: 'node1' | 'node2' | 'node3' | 'node4'; icon: LucideIcon }[] = [
  { key: 'node1', icon: FileSpreadsheet },
  { key: 'node2', icon: Upload },
  { key: 'node3', icon: Tags },
  { key: 'node4', icon: LayoutDashboard },
]

/** What each node holds for one example file, shown under the lane as the app's own UI would. */
function NodeDetail({ node }: { node: (typeof NODES)[number]['key'] }) {
  const { t } = useTranslation()
  const line = (a: string, b?: string) => (
    <div className="flex items-center justify-between gap-2 rounded-md bg-muted px-2.5 py-1.5 text-xs">
      <span className="truncate">{a}</span>
      {b && <span className="shrink-0 text-muted-foreground tabular-nums">{b}</span>}
    </div>
  )
  if (node === 'node1')
    return (
      <>
        {line('statement-nov.xlsx')}
        {line(t('import.dateColumn'), 'A')}
        {line(t('import.titleColumn'), 'C')}
        {line(t('import.debitColumn'), 'E')}
        {line(t('import.creditColumn'), 'F')}
      </>
    )
  if (node === 'node2')
    return (
      <>
        {line('Rami Levy', '-275')}
        {line('Salary', '+15,000')}
        {line('Fuel', '-289')}
        {line('Cafe', '-222')}
        {line('Gym', '-150')}
      </>
    )
  if (node === 'node3')
    return (
      <>
        {line(t('categories.groceries'))}
        {line(t('categories.salary'))}
        {line(t('categories.transport'))}
        {line(t('categories.dining'))}
        {line(t('categories.health'))}
      </>
    )
  return (
    <div className="flex h-full flex-col justify-end gap-1.5 rounded-md bg-muted p-2.5">
      <div className="flex h-36 items-end gap-1.5">
        {[62, 70, 58, 92, 66, 48].map((h, i) => (
          <span key={i} className="flex-1 rounded-t-[3px] bg-primary/80" style={{ height: `${h}%` }} />
        ))}
      </div>
      <span className="text-xs text-muted-foreground">{t('dashboard.cashflow')}</span>
    </div>
  )
}

/** The one diagram card: four nodes in a lane, pulses running along the lines, each node's content under it. */
function FlowDiagram() {
  const { t } = useTranslation()
  return (
    <div data-diagram className="glow-card rounded-2xl bg-card p-6 lg:p-8" role="img" aria-label={t('landing.flow.h2')}>
      <ol className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4">
        {NODES.map(({ key, icon: Icon }, i) => (
          <li key={key} className="relative flex flex-col gap-3">
            {/* The line runs toward the next node in reading order; in RTL it is mirrored so the pulse travels right to left. */}
            {i < NODES.length - 1 && (
              <span className="absolute top-7 start-[calc(50%+32px)] hidden h-px w-[calc(100%-48px)] bg-border sm:block rtl:-scale-x-100" aria-hidden>
                <span className="pulse absolute -top-[3px] size-[7px] rounded-full bg-primary" style={{ animationDelay: `${i * 0.6}s` }} />
              </span>
            )}
            <span className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-border bg-background text-primary">
              <Icon className="size-6" aria-hidden />
            </span>
            <span className="text-center text-sm font-medium">{t(`landing.flow.${key}`)}</span>
            <div className="flex min-h-56 flex-col gap-1.5">
              <NodeDetail node={key} />
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

/** split: the text above on its own row, the diagram card across the container under it. */
export function FlowSection() {
  const { t } = useTranslation()
  return (
    <Section id="flow">
      <div className="flex h-full flex-col gap-12">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-x-6">
          <h2 id="flow-h" className="lg:col-span-5">
            {t('landing.flow.h2')}
          </h2>
          <p className="text-lg leading-7 text-muted-foreground lg:col-span-6 lg:col-start-7">{t('landing.flow.lead')}</p>
        </div>
        <FlowDiagram />
      </div>
    </Section>
  )
}
