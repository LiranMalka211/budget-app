import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { CategorySelect } from '@/components/common/CategorySelect'
import { useApiErrorMessage } from '@/components/common/ErrorState'
import { FormField } from '@/components/common/FormField'
import { TypeToggle } from '@/components/common/TypeToggle'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FieldGroup } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useCategories, useTypeHelpers } from '@/hooks/useLookups'
import { todayIso } from '@/lib/format/dates'
import type { Transaction } from '@/types'
import { transactionSchema, type TransactionFormOutput, type TransactionFormValues } from '../schemas'
import { useCreateTransaction, useUpdateTransaction } from '../useTransactions'

interface TransactionFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** When set the dialog edits this transaction, otherwise it creates a new one. */
  transaction?: Transaction | null
}

/** Dialog with the add/edit transaction form (type, amount, title, category, date, note). */
export function TransactionForm({ open, onOpenChange, transaction }: TransactionFormProps) {
  const { t } = useTranslation()
  const toMessage = useApiErrorMessage()
  const { idOf } = useTypeHelpers()
  const { data: categories = [] } = useCategories()
  const create = useCreateTransaction()
  const update = useUpdateTransaction()

  const form = useForm<TransactionFormValues, unknown, TransactionFormOutput>({
    resolver: zodResolver(transactionSchema),
    defaultValues: { date: todayIso(), title: '', amount: '', typeId: '', categoryId: '', note: '' },
  })

  // Reset the form whenever the dialog opens for a different transaction.
  useEffect(() => {
    if (!open) return
    form.reset(
      transaction
        ? {
            date: transaction.date,
            title: transaction.title,
            amount: String(transaction.amount),
            typeId: transaction.typeId,
            categoryId: transaction.categoryId,
            note: transaction.note ?? '',
          }
        : { date: todayIso(), title: '', amount: '', typeId: idOf('expense'), categoryId: '', note: '' },
    )
  }, [open, transaction, form, idOf])

  const typeId = form.watch('typeId')
  const categoryId = form.watch('categoryId')

  // Clear the category when the type changes and the current category no longer fits.
  useEffect(() => {
    const cat = categories.find((c) => c.id === categoryId)
    if (cat && cat.typeId !== typeId) form.setValue('categoryId', '')
  }, [typeId, categoryId, categories, form])

  /** Saves the transaction, shows a toast and closes the dialog. */
  const onSubmit = form.handleSubmit(async (values) => {
    const input = { ...values, note: values.note || undefined }
    try {
      if (transaction) await update.mutateAsync({ id: transaction.id, input })
      else await create.mutateAsync(input)
      toast.success(t('transactions.created'))
      onOpenChange(false)
    } catch (err) {
      toast.error(toMessage(err))
    }
  })

  const { errors, isSubmitting } = form.formState

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{transaction ? t('transactions.edit') : t('transactions.add')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate>
          <FieldGroup>
            <Controller
              control={form.control}
              name="typeId"
              render={({ field }) => <TypeToggle value={field.value} onChange={field.onChange} />}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField id="tx-amount" label={t('common.amount')} error={errors.amount?.message}>
                <Input id="tx-amount" type="number" inputMode="decimal" step="0.01" min="0" {...form.register('amount')} />
              </FormField>
              <FormField id="tx-date" label={t('common.date')} error={errors.date?.message}>
                <Input id="tx-date" type="date" {...form.register('date')} />
              </FormField>
            </div>
            <FormField id="tx-title" label={t('common.title')} error={errors.title?.message}>
              <Input id="tx-title" {...form.register('title')} />
            </FormField>
            <FormField id="tx-category" label={t('common.category')} error={errors.categoryId?.message}>
              <Controller
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <CategorySelect id="tx-category" value={field.value} onChange={field.onChange} typeId={typeId} allowCreate />
                )}
              />
            </FormField>
            <FormField id="tx-note" label={t('common.note')} optional error={errors.note?.message}>
              <Textarea id="tx-note" rows={2} {...form.register('note')} />
            </FormField>
          </FieldGroup>
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              {t('common.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
