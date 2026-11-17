import { Clock, KeyRound, LogOut, Plus, Users } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState, useApiErrorMessage } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { PageHeader } from '@/components/common/PageHeader'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import type { FamilyMember } from '@/types'
import { CreateFamilyDialog, JoinFamilyDialog } from '../components/FamilyDialogs'
import { InviteKeyCard } from '../components/InviteKeyCard'
import { MembersTable, PendingRequestsList } from '../components/MembersTable'
import { useApproveMember, useFamilyOverview, useLeaveFamily, useRemoveMember, useSetMemberPermission } from '../useFamily'

/** Family page: create/join when alone, pending notice while waiting, and member management once approved. */
export default function FamilyPage() {
  const { t } = useTranslation()
  const toMessage = useApiErrorMessage()
  const query = useFamilyOverview()
  const approve = useApproveMember()
  const remove = useRemoveMember()
  const leave = useLeaveFamily()
  const permission = useSetMemberPermission()
  const [createOpen, setCreateOpen] = useState(false)
  const [joinOpen, setJoinOpen] = useState(false)
  const [removing, setRemoving] = useState<FamilyMember | null>(null)
  const [leaveOpen, setLeaveOpen] = useState(false)

  /** Approves a pending request. */
  const handleApprove = async (m: FamilyMember) => {
    try {
      await approve.mutateAsync(m.userId)
    } catch (err) {
      toast.error(toMessage(err, 'family'))
    }
  }

  /** Head grants or revokes a member's edit permission. */
  const handlePermission = async (m: FamilyMember, canEdit: boolean) => {
    try {
      await permission.mutateAsync({ userId: m.userId, canEdit })
      toast.success(t(canEdit ? 'family.permissions.granted' : 'family.permissions.revoked', { name: m.user.firstName }))
    } catch (err) {
      toast.error(toMessage(err, 'family'))
    }
  }

  /** Rejects a pending request immediately (no confirmation needed). */
  const handleReject = async (m: FamilyMember) => {
    try {
      await remove.mutateAsync(m.userId)
    } catch (err) {
      toast.error(toMessage(err, 'family'))
    }
  }

  /** Removes the approved member awaiting confirmation. */
  const confirmRemove = async () => {
    if (!removing) return
    try {
      await remove.mutateAsync(removing.userId)
    } catch (err) {
      toast.error(toMessage(err, 'family'))
    } finally {
      setRemoving(null)
    }
  }

  /** Leaves the family (or cancels a pending request). */
  const confirmLeave = async () => {
    try {
      await leave.mutateAsync()
    } catch (err) {
      toast.error(toMessage(err, 'family'))
    } finally {
      setLeaveOpen(false)
    }
  }

  const overview = query.data
  const dialogs = (
    <>
      <CreateFamilyDialog open={createOpen} onOpenChange={setCreateOpen} />
      <JoinFamilyDialog open={joinOpen} onOpenChange={setJoinOpen} />
    </>
  )

  if (query.isPending) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title={t('family.title')} subtitle={t('family.subtitle')} />
        <LoadingState />
      </div>
    )
  }

  if (query.isError) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title={t('family.title')} subtitle={t('family.subtitle')} />
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      </div>
    )
  }

  // No family link at all: offer to create or join.
  if (!overview) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title={t('family.title')} subtitle={t('family.subtitle')} />
        <EmptyState
          icon={Users}
          title={t('family.noFamily')}
          description={t('family.noFamilyHint')}
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button onClick={() => setCreateOpen(true)}>
                <Plus /> {t('family.create')}
              </Button>
              <Button variant="outline" onClick={() => setJoinOpen(true)}>
                <KeyRound /> {t('family.join')}
              </Button>
            </div>
          }
        />
        {dialogs}
      </div>
    )
  }

  // Join request sent but not yet approved.
  if (overview.myStatus === 'pending') {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title={overview.family.name} subtitle={t('family.subtitle')} />
        <Alert>
          <Clock />
          <AlertTitle>{t('family.pendingApproval')}</AlertTitle>
          <AlertDescription>{t('family.pendingApprovalHint')}</AlertDescription>
        </Alert>
        <div>
          <Button variant="outline" onClick={() => void confirmLeave()} disabled={leave.isPending}>
            <LogOut /> {t('common.cancel')}
          </Button>
        </div>
      </div>
    )
  }

  const canLeave = !overview.isHead || overview.members.length <= 1

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={overview.family.name}
        subtitle={t('family.subtitle')}
        actions={
          canLeave && (
            <Button variant="outline" onClick={() => setLeaveOpen(true)}>
              <LogOut /> {t('family.leave')}
            </Button>
          )
        }
      />

      {overview.isHead && <InviteKeyCard inviteKey={overview.family.inviteKey} />}

      <div className="grid gap-6 lg:grid-cols-2">
        <MembersTable
          members={overview.members}
          headUserId={overview.family.headUserId}
          canManage={overview.isHead}
          onRemove={setRemoving}
          onPermissionChange={(m, v) => void handlePermission(m, v)}
          permissionBusy={permission.isPending}
        />
        {overview.isHead && (
          <PendingRequestsList
            pending={overview.pending}
            onApprove={(m) => void handleApprove(m)}
            onReject={(m) => void handleReject(m)}
            busy={approve.isPending || remove.isPending}
          />
        )}
      </div>

      <ConfirmDialog
        open={Boolean(removing)}
        onOpenChange={(o) => !o && setRemoving(null)}
        title={t('family.remove')}
        description={removing ? t('family.removeConfirm', { name: `${removing.user.firstName} ${removing.user.lastName}` }) : undefined}
        confirmLabel={t('family.remove')}
        loading={remove.isPending}
        onConfirm={() => void confirmRemove()}
      />
      <ConfirmDialog
        open={leaveOpen}
        onOpenChange={setLeaveOpen}
        title={t('family.leave')}
        description={t('family.leaveConfirm')}
        confirmLabel={t('family.leave')}
        loading={leave.isPending}
        onConfirm={() => void confirmLeave()}
      />
    </div>
  )
}
