import { Check, Copy, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useApiErrorMessage } from '@/components/common/ErrorState'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useRegenerateKey } from '../useFamily'

/** Shows the family invite key with copy and regenerate actions (head of family only). */
export function InviteKeyCard({ inviteKey }: { inviteKey: string }) {
  const { t } = useTranslation()
  const toMessage = useApiErrorMessage()
  const regenerate = useRegenerateKey()
  const [copied, setCopied] = useState(false)

  /** Copies the key to the clipboard and shows a short confirmation. */
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(inviteKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error(t('errors.generic'))
    }
  }

  /** Replaces the key; the old one stops working immediately. */
  const handleRegenerate = async () => {
    try {
      await regenerate.mutateAsync()
    } catch (err) {
      toast.error(toMessage(err, 'family'))
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('family.inviteKey')}</CardTitle>
        <CardDescription>{t('family.inviteKeyHint')}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-2">
        <code className="rounded-lg border bg-muted px-3 py-2 font-mono text-lg tracking-widest">{inviteKey}</code>
        <Button variant="outline" onClick={() => void copy()}>
          {copied ? <Check /> : <Copy />} {copied ? t('common.copied') : t('common.copy')}
        </Button>
        <Button variant="ghost" onClick={() => void handleRegenerate()} disabled={regenerate.isPending}>
          <RefreshCw className={regenerate.isPending ? 'animate-spin' : ''} /> {t('family.regenerateKey')}
        </Button>
      </CardContent>
    </Card>
  )
}
