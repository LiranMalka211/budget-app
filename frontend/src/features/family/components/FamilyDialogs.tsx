import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useApiErrorMessage } from '@/components/common/ErrorState'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateFamily, useJoinFamily } from '../useFamily'

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Dialog that asks for a family name and creates the family with the current user as head. */
export function CreateFamilyDialog({ open, onOpenChange }: DialogProps) {
  const { t } = useTranslation()
  const toMessage = useApiErrorMessage()
  const create = useCreateFamily()
  const [name, setName] = useState('')

  /** Creates the family and closes the dialog. */
  const submit = async () => {
    if (!name.trim()) return
    try {
      await create.mutateAsync(name.trim())
      toast.success(t('family.created'))
      setName('')
      onOpenChange(false)
    } catch (err) {
      toast.error(toMessage(err, 'family'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('family.create')}</DialogTitle>
          <DialogDescription>{t('family.subtitle')}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="family-name">{t('family.familyName')}</Label>
          <Input
            id="family-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void submit()}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={() => void submit()} disabled={!name.trim() || create.isPending}>
            {create.isPending && <Loader2 className="animate-spin" />}
            {t('family.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Dialog that asks for an invite key and sends a join request. */
export function JoinFamilyDialog({ open, onOpenChange }: DialogProps) {
  const { t } = useTranslation()
  const toMessage = useApiErrorMessage()
  const join = useJoinFamily()
  const [key, setKey] = useState('')

  /** Sends the join request and closes the dialog. */
  const submit = async () => {
    if (!key.trim()) return
    try {
      await join.mutateAsync(key.trim())
      toast.success(t('family.joinRequested'))
      setKey('')
      onOpenChange(false)
    } catch (err) {
      toast.error(toMessage(err, 'family'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('family.join')}</DialogTitle>
          <DialogDescription>{t('family.enterKey')}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="invite-key">{t('family.inviteKey')}</Label>
          <Input
            id="invite-key"
            value={key}
            onChange={(e) => setKey(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && void submit()}
            placeholder="ABCD-1234"
            className="font-mono tracking-wider"
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={() => void submit()} disabled={!key.trim() || join.isPending}>
            {join.isPending && <Loader2 className="animate-spin" />}
            {t('family.join')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
