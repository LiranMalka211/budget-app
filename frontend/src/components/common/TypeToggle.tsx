import { useTranslation } from 'react-i18next'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useTypeHelpers } from '@/hooks/useLookups'
import type { TransactionTypeKey } from '@/types'

interface TypeToggleProps {
  /** Selected type id. */
  value: string
  onChange: (typeId: string) => void
  className?: string
}

/** Segmented income/expense switch that works with type ids rather than keys. */
export function TypeToggle({ value, onChange, className }: TypeToggleProps) {
  const { t } = useTranslation()
  const { types, idOf } = useTypeHelpers()
  const currentKey = types.find((x) => x.id === value)?.type ?? 'expense'
  return (
    <Tabs value={currentKey} onValueChange={(k) => onChange(idOf(k as TransactionTypeKey))} className={className}>
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="expense">{t('common.expense')}</TabsTrigger>
        <TabsTrigger value="income">{t('common.income')}</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
