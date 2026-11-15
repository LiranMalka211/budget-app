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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCategories, useTypeHelpers } from '@/hooks/useLookups'
import { todayIso } from '@/lib/format/dates'
import type { RecurrenceInterval, ScheduledTransaction } from '@/types'
import { scheduledSchema, type ScheduledFormOutput, type ScheduledFormValues } from '../schemas'
import { useCreateScheduled, useUpdateScheduled } from '../useScheduled'

interface ScheduledFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** When set the dialog edits this schedule, otherwise it creates a new one. */
  scheduled?: ScheduledTransaction | null
}

const INTERVALS: RecurrenceInterval[] = ['weekly', 'monthly', 'yearly']

/** Dialog for creating or editing a recurring payment (e.g. "every month, 150 to the gym"). */
export function ScheduledForm({ open, onOpenChange, scheduled }: ScheduledFormProps) {
  const { t } = useTranslation()
  const toMessage = useApiErrorMessage()
  const { idOf } = useTypeHelpers()
  const { data: categories = [] } = useCategories()
  const create = useCreateScheduled()
  const update = useUpdateScheduled()

  const form = useForm<ScheduledFormValues, unknown, ScheduledFormOutput>({
    resolver: zodResolver(scheduledSchema),
    defaultValues: {
      title: '',
      amount: '',
      typeId: '',
      categoryId: '',
      interval: 'monthly',
      dayOfMonth: '1',
      startDate: todayIso(),
      endDate: '',
    },
  })

  // Reset when opening for a different schedule.
  useEffect(() => {
    if (!open) return
    form.reset(
      scheduled
        ? {
            title: scheduled.title,
            amount: String(scheduled.amount),
            typeId: scheduled.typeId,
            categoryId: scheduled.categoryId,
            interval: scheduled.interval,
            dayOfMonth: scheduled.dayOfMonth ? String(scheduled.dayOfMonth) : '1',
            startDate: scheduled.startDate,
            endDate: scheduled.endDate ?? '',
          }
        : {
            title: '',
            amount: '',
            typeId: idOf('expense'),
            categoryId: '',
            interval: 'monthly',
            dayOfMonth: String(new Date().getDate()),
            startDate: todayIso(),
            endDate: '',
          },
    )
  }, [open, scheduled, form, idOf])

  const typeId = form.watch('typeId')
  const categoryId = form.watch('categoryId')
  const interval = form.watch('interval')

  useEffect(() => {
    const cat = categories.find((c) => c.id === categoryId)
    if (cat && cat.typeId !== typeId) form.setValue('categoryId', '')
  }, [typeId, categoryId, categories, form])

  /** Saves the schedule and closes the dialog. */
  const onSubmit = form.handleSubmit(async (values) => {
    const input = {
      ...values,
      dayOfMonth: values.interval === 'weekly' ? undefined : values.dayOfMonth,
      endDate: values.endDate || null,
    }
    try {
      if (scheduled) await update.mutateAsync({ id: scheduled.id, input })
      else await create.mutateAsync(input)
      toast.success(t('scheduled.saved'))
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
          <DialogTitle>{scheduled ? t('scheduled.edit') : t('scheduled.add')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate>
          <FieldGroup>
            <Controller
              control={form.control}
              name="typeId"
              render={({ field }) => <TypeToggle value={field.value} onChange={field.onChange} />}
            />
            <FormField id="sch-title" label={t('common.title')} error={errors.title?.message}>
              <Input id="sch-title" placeholder="Gym" {...form.register('title')} />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField id="sch-amount" label={t('common.amount')} error={errors.amount?.message}>
                <Input id="sch-amount" type="number" inputMode="decimal" step="0.01" min="0" {...form.register('amount')} />
              </FormField>
              <FormField id="sch-category" label={t('common.category')} error={errors.categoryId?.message}>
                <Controller
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <CategorySelect id="sch-category" value={field.value} onChange={field.onChange} typeId={typeId} allowCreate />
                  )}
                />
              </FormField>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField id="sch-interval" label={t('scheduled.interval')} error={errors.interval?.message}>
                <Controller
                  control={form.control}
                  name="interval"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="sch-interval" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {INTERVALS.map((i) => (
                          <SelectItem key={i} value={i}>
                            {t(`scheduled.${i}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>
              {interval !== 'weekly' && (
                <FormField id="sch-day" label={t('scheduled.dayOfMonth')} error={errors.dayOfMonth?.message}>
                  <Input id="sch-day" type="number" min={1} max={31} inputMode="numeric" {...form.register('dayOfMonth')} />
                </FormField>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField id="sch-start" label={t('scheduled.startDate')} error={errors.startDate?.message}>
                <Input id="sch-start" type="date" {...form.register('startDate')} />
              </FormField>
              <FormField id="sch-end" label={t('scheduled.endDate')} optional error={errors.endDate?.message}>
                <Input id="sch-end" type="date" {...form.register('endDate')} />
              </FormField>
            </div>
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
