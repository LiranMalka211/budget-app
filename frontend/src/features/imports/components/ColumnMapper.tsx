import { useTranslation } from 'react-i18next'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { ColumnMapping, ImportSource } from '@/types'
import type { AmountMode } from '../parsers/bankPresets'

interface ColumnMapperProps {
  headers: string[]
  value: ColumnMapping
  onChange: (next: ColumnMapping) => void
  source: ImportSource
  onSourceChange: (source: ImportSource) => void
  mode: AmountMode
  onModeChange: (mode: AmountMode) => void
}


const NONE = '__none__'
const SOURCES: ImportSource[] = ['bank', 'credit', 'other']

/** One labelled column dropdown. */
function ColumnSelect({
  id,
  label,
  headers,
  value,
  onChange,
}: {
  id: string
  label: string
  headers: string[]
  value: string | null
  onChange: (v: string | null) => void
}) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value ?? NONE} onValueChange={(v) => onChange(v === NONE ? null : v)}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>{t('import.notMapped')}</SelectItem>
          {headers.map((h) => (
            <SelectItem key={h} value={h}>
              {h}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

/** Lets the user confirm which file columns hold the date, description and amount(s). */
export function ColumnMapper({ headers, value, onChange, source, onSourceChange, mode, onModeChange }: ColumnMapperProps) {
  const { t } = useTranslation()

  /** Switches between one signed column and separate debit/credit columns, clearing the other mode's columns. */
  const setMode = (m: string) => {
    const next = m as AmountMode
    onModeChange(next)
    onChange(next === 'split' ? { ...value, amount: null } : { ...value, debit: null, credit: null })
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label>{t('import.source')}</Label>
        <Tabs value={source} onValueChange={(v) => onSourceChange(v as ImportSource)}>
          <TabsList className="grid w-full grid-cols-3 sm:w-auto sm:inline-grid">
            {SOURCES.map((s) => (
              <TabsTrigger key={s} value={s}>
                {t(`import.${s}`)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        {source === 'credit' && <p className="text-xs text-muted-foreground">{t('import.creditNote')}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <ColumnSelect id="map-date" label={t('import.dateColumn')} headers={headers} value={value.date} onChange={(v) => onChange({ ...value, date: v })} />
        <ColumnSelect id="map-title" label={t('import.titleColumn')} headers={headers} value={value.title} onChange={(v) => onChange({ ...value, title: v })} />
      </div>

      <Tabs value={mode} onValueChange={setMode}>
        <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:inline-grid">
          <TabsTrigger value="single">{t('import.singleAmount')}</TabsTrigger>
          <TabsTrigger value="split">{t('import.splitAmount')}</TabsTrigger>
        </TabsList>
      </Tabs>

      {mode === 'single' ? (
        <ColumnSelect id="map-amount" label={t('import.amountColumn')} headers={headers} value={value.amount} onChange={(v) => onChange({ ...value, amount: v })} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <ColumnSelect id="map-debit" label={t('import.debitColumn')} headers={headers} value={value.debit} onChange={(v) => onChange({ ...value, debit: v })} />
          <ColumnSelect id="map-credit" label={t('import.creditColumn')} headers={headers} value={value.credit} onChange={(v) => onChange({ ...value, credit: v })} />
        </div>
      )}
    </div>
  )
}
