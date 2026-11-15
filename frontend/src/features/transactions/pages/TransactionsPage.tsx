import { Check, Loader2, Pencil, Plus, ReceiptText, X } from 'lucide-react'
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
import { TransactionsEditTable } from '../components/TransactionsEditTable'
import { isValidAmount, type RowDraft } from '../inlineEdit'
import { TransactionsTable } from '../components/TransactionsTable'
import { useDeleteTransaction, useTransactionsList, useUpdateTransaction } from '../useTransactions'

const PAGE_SIZE = 20

/** A row's saved values in the shape the inline editor uses. */
function savedValues(tx: Transaction): RowDraft {
  return { categoryId: tx.categoryId, amount: String(tx.amount), note: tx.note ?? '' }
}

/** True when the draft matches what is saved (so the row is not dirty). */
function sameAsSaved(tx: Transaction, d: RowDraft): boolean {
  const saved = savedValues(tx)
  return d.categoryId === saved.categoryId && Number(d.amount) === tx.amount && d.amount.trim() !== '' && d.note.trim() === saved.note.trim()
}

/**
 * Transactions page: filters, paged table/cards, the add/edit/delete flows, and an edit mode
 * where category, amount and note are changed inline on many rows and saved together.
 */
export default function TransactionsPage() {
  const { t } = useTranslation()
  const toMessage = useApiErrorMessage()
  const [filters, setFilters] = useState<Filters>({ page: 1, pageSize: PAGE_SIZE })
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [deleting, setDeleting] = useState<Transaction | null>(null)

  // Inline edit mode: unsaved changes per transaction id, with the transaction they apply to.
  const [editMode, setEditMode] = useState(false)
  const [drafts, setDrafts] = useState<Record<string, { tx: Transaction; draft: RowDraft }>>({})
  const [saving, setSaving] = useState(false)
  const [confirmDiscard, setConfirmDiscard] = useState(false)

  const query = useTransactionsList(filters)
  const remove = useDeleteTransaction()
  const update = useUpdateTransaction()

  const dirtyCount = Object.keys(drafts).length
  const hasInvalid = Object.values(drafts).some(({ draft }) => !isValidAmount(draft.amount))

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

  /** Current inline values of a row. */
  const valueOf = (tx: Transaction): RowDraft => drafts[tx.id]?.draft ?? savedValues(tx)

  /** Applies an inline change; a row edited back to its saved values stops being dirty. */
  const changeRow = (tx: Transaction, patch: Partial<RowDraft>) => {
    setDrafts((prev) => {
      const next = { ...valueOf(tx), ...patch }
      const copy = { ...prev }
      if (sameAsSaved(tx, next)) delete copy[tx.id]
      else copy[tx.id] = { tx, draft: next }
      return copy
    })
  }

  /** Leaves edit mode, dropping any unsaved changes. */
  const exitEditMode = () => {
    setDrafts({})
    setEditMode(false)
    setConfirmDiscard(false)
  }

  /** Cancel button: asks first when there is something to lose. */
  const requestCancel = () => (dirtyCount > 0 ? setConfirmDiscard(true) : exitEditMode())

  /** Saves every changed row; rows that fail stay in edit mode with their changes. */
  const saveAll = async () => {
    const entries = Object.entries(drafts)
    if (entries.length === 0 || hasInvalid) return
    setSaving(true)
    const results = await Promise.allSettled(
      entries.map(([id, { tx, draft }]) =>
        update.mutateAsync({
          id,
          input: {
            date: tx.date,
            title: tx.title,
            typeId: tx.typeId,
            categoryId: draft.categoryId,
            amount: Number(draft.amount),
            note: draft.note.trim() || undefined,
          },
        }),
      ),
    )
    setSaving(false)
    const failed = entries.filter((_, i) => results[i].status === 'rejected')
    const savedCount = entries.length - failed.length
    if (savedCount > 0) toast.success(t('transactions.bulkSaved', { count: savedCount }))
    if (failed.length === 0) {
      exitEditMode()
      return
    }
    const firstError = results.find((r): r is PromiseRejectedResult => r.status === 'rejected')
    toast.error(`${t('transactions.bulkFailed', { count: failed.length })} ${toMessage(firstError?.reason)}`)
    setDrafts(Object.fromEntries(failed))
  }

  /** Deletes the transaction awaiting confirmation. */
  const confirmDelete = async () => {
    if (!deleting) return
    try {
      await remove.mutateAsync(deleting.id)
      setDrafts(({ [deleting.id]: _removed, ...rest }) => rest)
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
  // Paging or filtering would swap the rows being edited, so both wait until changes are saved or dropped.
  const navigationLocked = dirtyCount > 0

  const headerActions = editMode ? (
    <>
      <Button variant="outline" onClick={requestCancel} disabled={saving}>
        <X /> {t('common.cancel')}
      </Button>
      <Button onClick={() => void saveAll()} disabled={dirtyCount === 0 || hasInvalid || saving}>
        {saving ? <Loader2 className="animate-spin" /> : <Check />}
        {t('transactions.saveChanges', { count: dirtyCount })}
      </Button>
    </>
  ) : (
    <>
      <Button variant="outline" onClick={() => setEditMode(true)} disabled={!data || data.items.length === 0}>
        <Pencil /> {t('transactions.editMode')}
      </Button>
      <Button onClick={openCreate}>
        <Plus /> {t('transactions.add')}
      </Button>
    </>
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t('transactions.title')} subtitle={t('transactions.subtitle')} actions={headerActions} />

      {editMode && (
        <p className="rounded-lg border border-primary/20 bg-accent/60 px-4 py-2.5 text-sm text-accent-foreground" role="status">
          {navigationLocked ? t('transactions.unsavedHint', { count: dirtyCount }) : t('transactions.editModeHint')}
        </p>
      )}

      <fieldset disabled={navigationLocked} className="min-w-0 disabled:opacity-60">
        <TransactionFilters value={filters} onChange={setFilters} />
      </fieldset>

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
            {editMode ? (
              <TransactionsEditTable
                items={data.items}
                valueOf={valueOf}
                isDirty={(tx) => tx.id in drafts}
                onChange={changeRow}
                onDelete={setDeleting}
              />
            ) : (
              <TransactionsTable items={data.items} onEdit={openEdit} onDelete={setDeleting} />
            )}
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
                  disabled={page <= 1 || navigationLocked}
                  onClick={() => setFilters({ ...filters, page: page - 1 })}
                >
                  {t('transactions.previous')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page * PAGE_SIZE >= data.total || navigationLocked}
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
      <ConfirmDialog
        open={confirmDiscard}
        onOpenChange={setConfirmDiscard}
        title={t('transactions.discardTitle')}
        description={t('transactions.discardDescription', { count: dirtyCount })}
        confirmLabel={t('transactions.discard')}
        onConfirm={exitEditMode}
      />
    </div>
  )
}
