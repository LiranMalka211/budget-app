import { AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from 'cn'
import { CategorySelect } from '@/components/common/CategorySelect'
import { MoneyText } from '@/components/common/MoneyText'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useTypeHelpers } from '@/hooks/useLookups'
import { formatDate } from '@/lib/format/dates'
import { useLocale } from '@/lib/i18n/useDirection'
import type { NormalizedRow } from '@/types'

interface ImportPreviewTableProps {
  rows: NormalizedRow[]
  onCategoryChange: (key: string, categoryId: string) => void
  /** Assigns one category to every valid expense row at once. */
  onApplyToAllExpenses: (categoryId: string) => void
}

/** Review table for parsed rows: shows what will be imported and lets the user pick a category per row. */
export function ImportPreviewTable({ rows, onCategoryChange, onApplyToAllExpenses }: ImportPreviewTableProps) {
  const { t } = useTranslation()
  const locale = useLocale()
  const { idOf } = useTypeHelpers()
  const invalidCount = rows.filter((r) => r.invalid).length

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          {t('import.rowsFound', { count: rows.length })}
          {invalidCount > 0 && (
            <span className="ms-2 inline-flex items-center gap-1 text-amber-600">
              <AlertTriangle className="size-3.5" /> {t('import.invalidRows', { count: invalidCount })}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="whitespace-nowrap text-muted-foreground">{t('import.applyToAll')}</span>
          <CategorySelect value="" onChange={onApplyToAllExpenses} typeId={idOf('expense')} className="w-48" />
        </div>
      </div>

      <div className="max-h-[60vh] overflow-auto rounded-xl border">
        <Table>
          <TableHeader className="sticky top-0 bg-background">
            <TableRow>
              <TableHead>{t('common.date')}</TableHead>
              <TableHead>{t('common.title')}</TableHead>
              <TableHead>{t('common.type')}</TableHead>
              <TableHead className="text-end">{t('common.amount')}</TableHead>
              <TableHead className="min-w-44">{t('import.assignCategory')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.key} className={cn(r.invalid && 'opacity-50')}>
                <TableCell className="whitespace-nowrap">{r.date ? formatDate(r.date, locale) : '—'}</TableCell>
                <TableCell className="max-w-64 truncate font-medium">{r.title || '—'}</TableCell>
                <TableCell>
                  <Badge variant={r.type === 'income' ? 'secondary' : 'outline'}>{t(`common.${r.type}`)}</Badge>
                </TableCell>
                <TableCell className="text-end">
                  {r.invalid ? '—' : <MoneyText amount={r.amount} isIncome={r.type === 'income'} />}
                </TableCell>
                <TableCell>
                  {!r.invalid && (
                    <CategorySelect
                      value={r.categoryId ?? ''}
                      onChange={(id) => onCategoryChange(r.key, id)}
                      typeId={idOf(r.type)}
                      className="w-full"
                    />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
