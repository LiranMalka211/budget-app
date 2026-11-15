import { Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from 'cn'
import { CategorySelect } from '@/components/common/CategorySelect'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useFamilyOverview, useMemberName } from '@/hooks/useFamilyOverview'
import { useTypeHelpers } from '@/hooks/useLookups'
import { formatDate } from '@/lib/format/dates'
import { useLocale } from '@/lib/i18n/useDirection'
import type { Transaction } from '@/types'
import { isValidAmount, type RowDraft } from '../inlineEdit'

interface TransactionsEditTableProps {
  items: Transaction[]
  /** Current values of a row: its unsaved draft, or the saved transaction. */
  valueOf: (tx: Transaction) => RowDraft
  isDirty: (tx: Transaction) => boolean
  onChange: (tx: Transaction, patch: Partial<RowDraft>) => void
  onDelete: (tx: Transaction) => void
}

/** Inline amount input; flagged when the value is not a positive number. */
function AmountInput({ tx, value, onChange }: { tx: Transaction; value: string; onChange: (v: string) => void }) {
  const { t } = useTranslation()
  const { isIncome } = useTypeHelpers()
  const invalid = !isValidAmount(value)
  return (
    <Input
      type="number"
      inputMode="decimal"
      step="0.01"
      min="0"
      dir="ltr"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={`${t('common.amount')}: ${tx.title}`}
      aria-invalid={invalid || undefined}
      title={invalid ? t('validation.positiveAmount') : undefined}
      className={cn('h-9 text-end tabular-nums', isIncome(tx.typeId) ? 'text-emerald-700' : 'text-rose-700')}
    />
  )
}

/**
 * Edit mode of the transactions list: category, amount and note are form fields on every row,
 * changed rows are highlighted, and delete is a direct button instead of a menu.
 */
export function TransactionsEditTable({ items, valueOf, isDirty, onChange, onDelete }: TransactionsEditTableProps) {
  const { t } = useTranslation()
  const locale = useLocale()
  const memberName = useMemberName()
  const { data: family } = useFamilyOverview()
  const showUploader = Boolean(family && family.myStatus === 'approved')

  const deleteButton = (tx: Transaction) => (
    <Button
      variant="ghost"
      size="icon-sm"
      className="text-muted-foreground hover:text-destructive"
      aria-label={`${t('common.delete')}: ${tx.title}`}
      onClick={() => onDelete(tx)}
    >
      <Trash2 />
    </Button>
  )

  return (
    <>
      {/* Mobile cards */}
      <ul className="flex flex-col gap-2 md:hidden">
        {items.map((tx) => {
          const v = valueOf(tx)
          return (
            <li
              key={tx.id}
              className={cn('flex flex-col gap-3 rounded-xl border bg-card p-3', isDirty(tx) && 'border-primary/40 bg-accent/40')}
            >
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{tx.title}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(tx.date, locale)}</p>
                </div>
                {deleteButton(tx)}
              </div>
              <CategorySelect value={v.categoryId} onChange={(categoryId) => onChange(tx, { categoryId })} typeId={tx.typeId} className="w-full" />
              <div className="grid grid-cols-[7rem_1fr] gap-2">
                <AmountInput tx={tx} value={v.amount} onChange={(amount) => onChange(tx, { amount })} />
                <Input
                  value={v.note}
                  onChange={(e) => onChange(tx, { note: e.target.value })}
                  placeholder={t('common.note')}
                  aria-label={`${t('common.note')}: ${tx.title}`}
                  className="h-9"
                />
              </div>
            </li>
          )
        })}
      </ul>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-xl border bg-card md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('common.date')}</TableHead>
              <TableHead>{t('common.title')}</TableHead>
              <TableHead className="min-w-44">{t('common.category')}</TableHead>
              {showUploader && <TableHead>{t('transactions.uploadedBy')}</TableHead>}
              <TableHead className="w-32 text-end">{t('common.amount')}</TableHead>
              <TableHead className="min-w-48">{t('common.note')}</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((tx) => {
              const v = valueOf(tx)
              return (
                <TableRow key={tx.id} className={cn(isDirty(tx) && 'bg-accent/50 hover:bg-accent/60')}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{formatDate(tx.date, locale)}</TableCell>
                  <TableCell className="max-w-48 truncate font-medium" title={tx.title}>
                    {tx.title}
                  </TableCell>
                  <TableCell className="py-1.5">
                    <CategorySelect value={v.categoryId} onChange={(categoryId) => onChange(tx, { categoryId })} typeId={tx.typeId} className="h-9 w-full" />
                  </TableCell>
                  {showUploader && <TableCell className="text-muted-foreground">{memberName(tx.userId)}</TableCell>}
                  <TableCell className="py-1.5">
                    <AmountInput tx={tx} value={v.amount} onChange={(amount) => onChange(tx, { amount })} />
                  </TableCell>
                  <TableCell className="py-1.5">
                    <Input
                      value={v.note}
                      onChange={(e) => onChange(tx, { note: e.target.value })}
                      placeholder={t('transactions.addNote')}
                      aria-label={`${t('common.note')}: ${tx.title}`}
                      className="h-9"
                    />
                  </TableCell>
                  <TableCell className="py-1.5">{deleteButton(tx)}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
