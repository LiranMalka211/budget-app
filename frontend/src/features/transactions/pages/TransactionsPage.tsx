import { Plus, ReceiptText } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState, useApiErrorMessage } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import type { Transaction, TransactionFilters as Filters } from '@/types'
import { TransactionFilters } from '../components/TransactionFilters'
import { TransactionForm } from '../components/TransactionForm'
import { TransactionsTable } from '../components/TransactionsTable'
import { useDeleteTransaction, useTransactionsList } from '../useTransactions'

const PAGE_SIZE = 20

/** Transactions page: filters, paged table/cards, and the add/edit/delete flows. */
export default function TransactionsPage() {
  const { t } = useTranslation()
  const toMessage = useApiErrorMessage()
  const [filters, setFilters] = useState<Filters>({ page: 1, pageSize: PAGE_SIZE })
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [deleting, setDeleting] = useState<Transaction | null>(null)

  const query = useTransactionsList(filters)
  const remove = useDeleteTransaction()

  /** Opens the form in create mode. */
  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }

  /** Opens the form in edit mode for the given transaction. */
  const openEdit = (tx: Transaction) => {
    setEditing(tx)
    setFormOpen(true)
  }

  /** Deletes the transaction awaiting confirmation. */
  const confirmDelete = async () => {
    if (!deleting) return
    try {
      await remove.mutateAsync(deleting.id)
      toast.success(t('transactions.deleted'))
    } catch (err) {
      toast.error(toMessage(err))
    } finally {
      setDeleting(null)
    }
  }

  const data = query.data
  const page = filters.page ?? 1
  const hasFilters = Boolean(filters.search || filters.typeId || filters.categoryId || filters.from || filters.to)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t('transactions.title')}
        subtitle={t('transactions.subtitle')}
        actions={
          <Button onClick={openCreate}>
            <Plus /> {t('transactions.add')}
          </Button>
        }
      />

      <TransactionFilters value={filters} onChange={setFilters} />

      {query.isPending ? (
        <LoadingState rows={6} />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : data && data.items.length === 0 ? (
        <EmptyState
          icon={ReceiptText}
          title={hasFilters ? t('common.noResults') : t('transactions.empty')}
          description={hasFilters ? undefined : t('transactions.emptyHint')}
          action={
            !hasFilters && (
              <Button onClick={openCreate} variant="outline">
                <Plus /> {t('transactions.add')}
              </Button>
            )
          }
        />
      ) : (
        data && (
          <>
            <TransactionsTable items={data.items} onEdit={openEdit} onDelete={setDeleting} />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {t('transactions.showing', {
                  from: (page - 1) * PAGE_SIZE + 1,
                  to: Math.min(page * PAGE_SIZE, data.total),
                  total: data.total,
                })}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setFilters({ ...filters, page: page - 1 })}
                >
                  {t('transactions.previous')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page * PAGE_SIZE >= data.total}
                  onClick={() => setFilters({ ...filters, page: page + 1 })}
                >
                  {t('transactions.next')}
                </Button>
              </div>
            </div>
          </>
        )
      )}

      <TransactionForm open={formOpen} onOpenChange={setFormOpen} transaction={editing} />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={t('common.delete')}
        description={t('transactions.deleteConfirm')}
        confirmLabel={t('common.delete')}
        loading={remove.isPending}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  )
}
