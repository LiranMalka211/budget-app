import { CalendarClock, Plus } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState, useApiErrorMessage } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import type { ScheduledTransaction } from '@/types'
import { ScheduledForm } from '../components/ScheduledForm'
import { useCanEdit } from '@/hooks/useFamilyOverview'
import { ScheduledList } from '../components/ScheduledList'
import { useDeleteScheduled, useScheduledList, useToggleScheduled } from '../useScheduled'

/** Scheduled payments page: list of recurring templates with add, edit, pause and delete. */
export default function ScheduledPage() {
  const { t } = useTranslation()
  const toMessage = useApiErrorMessage()
  const query = useScheduledList()
  const canEdit = useCanEdit()
  const remove = useDeleteScheduled()
  const toggle = useToggleScheduled()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<ScheduledTransaction | null>(null)
  const [deleting, setDeleting] = useState<ScheduledTransaction | null>(null)

  /** Opens the form in create mode. */
  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }

  /** Opens the form for an existing schedule. */
  const openEdit = (s: ScheduledTransaction) => {
    setEditing(s)
    setFormOpen(true)
  }

  /** Pauses or resumes a schedule, reporting API errors as toasts. */
  const handleToggle = async (s: ScheduledTransaction, isActive: boolean) => {
    try {
      await toggle.mutateAsync({ id: s.id, isActive })
    } catch (err) {
      toast.error(toMessage(err))
    }
  }

  /** Deletes the schedule awaiting confirmation. */
  const confirmDelete = async () => {
    if (!deleting) return
    try {
      await remove.mutateAsync(deleting.id)
      toast.success(t('scheduled.deleted'))
    } catch (err) {
      toast.error(toMessage(err))
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t('scheduled.title')}
        subtitle={t('scheduled.subtitle')}
        actions={
          <Button onClick={openCreate}>
            <Plus /> {t('scheduled.add')}
          </Button>
        }
      />

      {query.isPending ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : query.data.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title={t('scheduled.empty')}
          description={t('scheduled.emptyHint')}
          action={
            <Button variant="outline" onClick={openCreate}>
              <Plus /> {t('scheduled.add')}
            </Button>
          }
        />
      ) : (
        <ScheduledList
          items={query.data}
          onEdit={openEdit}
          onDelete={setDeleting}
          onToggle={(s, v) => void handleToggle(s, v)}
          canEdit={canEdit}
        />
      )}

      <ScheduledForm open={formOpen} onOpenChange={setFormOpen} scheduled={editing} />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={t('common.delete')}
        description={t('scheduled.deleteConfirm')}
        confirmLabel={t('common.delete')}
        loading={remove.isPending}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  )
}
