import { Check, Crown, UserMinus, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/features/auth/authStore'
import { formatDate } from '@/lib/format/dates'
import { useLocale } from '@/lib/i18n/useDirection'
import type { FamilyMember } from '@/types'

interface MembersTableProps {
  members: FamilyMember[]
  headUserId: string
  /** When true, shows the remove action on other members. */
  canManage: boolean
  onRemove: (member: FamilyMember) => void
}

/** Initials for the avatar badge. */
function initials(m: FamilyMember): string {
  return `${m.user.firstName.charAt(0)}${m.user.lastName.charAt(0)}`.toUpperCase()
}

/** List of approved members with role badges and a remove action for the head of the family. */
export function MembersTable({ members, headUserId, canManage, onRemove }: MembersTableProps) {
  const { t } = useTranslation()
  const locale = useLocale()
  const { user } = useAuth()
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('family.members')}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="divide-y">
          {members.map((m) => {
            const isHead = m.userId === headUserId
            const isMe = m.userId === user?.id
            return (
              <li key={m.userId} className="flex items-center gap-3 py-3">
                <Avatar>
                  <AvatarFallback>{initials(m)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {m.user.firstName} {m.user.lastName}
                    {isMe && <span className="ms-1 text-xs text-muted-foreground">({t('family.you')})</span>}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {m.user.email} · {t('family.memberSince', { date: formatDate(m.joinedAt.slice(0, 10), locale) })}
                  </p>
                </div>
                <Badge variant={isHead ? 'default' : 'secondary'}>
                  {isHead && <Crown className="size-3" />} {isHead ? t('family.head') : t('family.member')}
                </Badge>
                {canManage && !isHead && (
                  <Button variant="ghost" size="icon-sm" aria-label={t('family.remove')} onClick={() => onRemove(m)}>
                    <UserMinus />
                  </Button>
                )}
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}

interface PendingRequestsListProps {
  pending: FamilyMember[]
  onApprove: (member: FamilyMember) => void
  onReject: (member: FamilyMember) => void
  busy?: boolean
}

/** Join requests waiting for the head's decision, with approve and reject buttons. */
export function PendingRequestsList({ pending, onApprove, onReject, busy }: PendingRequestsListProps) {
  const { t } = useTranslation()
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('family.pending')}</CardTitle>
        {pending.length === 0 && <CardDescription>{t('family.noPending')}</CardDescription>}
      </CardHeader>
      {pending.length > 0 && (
        <CardContent>
          <ul className="divide-y">
            {pending.map((m) => (
              <li key={m.userId} className="flex items-center gap-3 py-3">
                <Avatar>
                  <AvatarFallback>{initials(m)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {m.user.firstName} {m.user.lastName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{m.user.email}</p>
                </div>
                <Button size="sm" onClick={() => onApprove(m)} disabled={busy}>
                  <Check /> {t('family.approve')}
                </Button>
                <Button size="sm" variant="outline" onClick={() => onReject(m)} disabled={busy}>
                  <X /> {t('family.reject')}
                </Button>
              </li>
            ))}
          </ul>
        </CardContent>
      )}
    </Card>
  )
}
