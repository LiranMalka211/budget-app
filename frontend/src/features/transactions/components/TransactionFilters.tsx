import { Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ALL_CATEGORIES, CategorySelect } from '@/components/common/CategorySelect'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDebounce } from '@/hooks/useDebounce'
import { useTypeHelpers } from '@/hooks/useLookups'
import type { TransactionFilters as Filters } from '@/types'

interface TransactionFiltersProps {
  value: Filters
  onChange: (next: Filters) => void
}

const ALL_TYPES = 'all'

/** Filter bar: debounced text search, type, category and date range. Resets paging on every change. */
export function TransactionFilters({ value, onChange }: TransactionFiltersProps) {
  const { t } = useTranslation()
  const { idOf } = useTypeHelpers()
  const [search, setSearch] = useState(value.search ?? '')
  const debouncedSearch = useDebounce(search)

  useEffect(() => {
    if ((value.search ?? '') !== debouncedSearch) onChange({ ...value, search: debouncedSearch || undefined, page: 1 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  /** Applies a partial change and jumps back to the first page. */
  const patch = (p: Partial<Filters>) => onChange({ ...value, ...p, page: 1 })

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
      <div className="relative lg:col-span-2">
        <Search className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('transactions.searchPlaceholder')}
          className="ps-8"
          aria-label={t('common.search')}
        />
      </div>
      <Select
        value={value.typeId ?? ALL_TYPES}
        onValueChange={(v) => patch({ typeId: v === ALL_TYPES ? undefined : v, categoryId: undefined })}
      >
        <SelectTrigger className="w-full" aria-label={t('common.type')}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_TYPES}>{t('transactions.allTypes')}</SelectItem>
          <SelectItem value={idOf('expense') || 'expense'}>{t('common.expense')}</SelectItem>
          <SelectItem value={idOf('income') || 'income'}>{t('common.income')}</SelectItem>
        </SelectContent>
      </Select>
      <CategorySelect
        value={value.categoryId ?? ALL_CATEGORIES}
        onChange={(v) => patch({ categoryId: v === ALL_CATEGORIES ? undefined : v })}
        typeId={value.typeId}
        allowAll
      />
      <div className="flex gap-2">
        <Input
          type="date"
          value={value.from ?? ''}
          onChange={(e) => patch({ from: e.target.value || undefined })}
          aria-label={t('scheduled.startDate')}
        />
        <Input
          type="date"
          value={value.to ?? ''}
          onChange={(e) => patch({ to: e.target.value || undefined })}
          aria-label={t('scheduled.endDate')}
        />
      </div>
    </div>
  )
}
