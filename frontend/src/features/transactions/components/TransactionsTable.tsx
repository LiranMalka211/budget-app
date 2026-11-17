import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { MoneyText } from '@/components/common/MoneyText'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useFamilyOverview, useMemberName } from '@/hooks/useFamilyOverview'
import { useCategoryLabel, useTypeHelpers } from '@/hooks/useLookups'
import { formatDate } from '@/lib/format/dates'
import { useLocale } from '@/lib/i18n/useDirection'
import type { Transaction } from '@/types'

interface TransactionsTableProps {
  items: Transaction[]
  /** Edit and delete; left out for members without edit permission, which hides the row menu. */
  onEdit?: (tx: Transaction) => void
  onDelete?: (tx: Transaction) => void
}

/** Edit/delete menu shown on each row. */
function RowActions({ tx, onEdit, onDelete }: { tx: Transaction } & Omit<TransactionsTableProps, 'items'>) {
  const { t } = useTranslation()
  if (!onEdit || !onDelete) return null
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={t('common.actions')}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEdit(tx)}>
          <Pencil /> {t('common.edit')}
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={() => onDelete(tx)}>
          <Trash2 /> {t('common.delete')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Transactions as a table on desktop and as a card list on phones, sharing the same data and actions. */
export function TransactionsTable({ items, onEdit, onDelete }: TransactionsTableProps) {
  const { t } = useTranslation()
  const locale = useLocale()
  const categoryLabel = useCategoryLabel()
  const { isIncome } = useTypeHelpers()
  const memberName = useMemberName()
  const { data: family } = useFamilyOverview()
  const showUploader = Boolean(family && family.myStatus === 'approved')

  return (
    <>
      {/* Mobile cards */}
      <ul className="flex flex-col gap-2 md:hidden">
        {items.map((tx) => (
          <li key={tx.id} className="flex items-center gap-3 rounded-xl border bg-card p-3">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{tx.title}</p>
              <p className="truncate text-xs text-muted-foreground">
                {formatDate(tx.date, locale)} · {categoryLabel(tx.categoryId)}
                {showUploader && ` · ${memberName(tx.userId)}`}
              </p>
              {tx.note && <p className="truncate text-xs text-muted-foreground italic">{tx.note}</p>}
            </div>
            <MoneyText amount={tx.amount} isIncome={isIncome(tx.typeId)} className="text-sm" />
            <RowActions tx={tx} onEdit={onEdit} onDelete={onDelete} />
          </li>
        ))}
      </ul>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-xl border bg-card md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('common.date')}</TableHead>
              <TableHead>{t('common.title')}</TableHead>
              <TableHead>{t('common.category')}</TableHead>
              <TableHead>{t('common.note')}</TableHead>
              {showUploader && <TableHead>{t('transactions.uploadedBy')}</TableHead>}
              <TableHead>{t('common.type')}</TableHead>
              <TableHead className="text-end">{t('common.amount')}</TableHead>
              {onEdit && <TableHead className="w-10" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell className="whitespace-nowrap text-muted-foreground">{formatDate(tx.date, locale)}</TableCell>
                <TableCell className="font-medium">{tx.title}</TableCell>
                <TableCell>{categoryLabel(tx.categoryId)}</TableCell>
                <TableCell className="max-w-56 truncate text-muted-foreground" title={tx.note || undefined}>
                  {tx.note || <span aria-hidden>—</span>}
                </TableCell>
                {showUploader && <TableCell className="text-muted-foreground">{memberName(tx.userId)}</TableCell>}
                <TableCell>
                  <Badge variant="outline">{t(`transactions.source.${tx.source}`)}</Badge>
                </TableCell>
                <TableCell className="text-end">
                  <MoneyText amount={tx.amount} isIncome={isIncome(tx.typeId)} />
                </TableCell>
                {onEdit && (
                  <TableCell>
                    <RowActions tx={tx} onEdit={onEdit} onDelete={onDelete} />
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
