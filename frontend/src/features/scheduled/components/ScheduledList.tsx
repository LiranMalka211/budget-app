import { CalendarClock, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { MoneyText } from '@/components/common/MoneyText'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/ui/switch'
import { useCategoryLabel, useTypeHelpers } from '@/hooks/useLookups'
import { formatDate } from '@/lib/format/dates'
import { useLocale } from '@/lib/i18n/useDirection'
import type { ScheduledTransaction } from '@/types'

interface ScheduledListProps {
  items: ScheduledTransaction[]
  onEdit: (s: ScheduledTransaction) => void
  onDelete: (s: ScheduledTransaction) => void
  onToggle: (s: ScheduledTransaction, isActive: boolean) => void
  /** False for members without edit permission: no menu, and the switch is read-only. */
  canEdit?: boolean
}

/** Responsive card grid of recurring payments with an active switch and edit/delete menu. */
export function ScheduledList({ items, onEdit, onDelete, onToggle, canEdit = true }: ScheduledListProps) {
  const { t } = useTranslation()
  const locale = useLocale()
  const categoryLabel = useCategoryLabel()
  const { isIncome } = useTypeHelpers()

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((s) => (
        <Card key={s.id} className={s.isActive ? '' : 'opacity-60'}>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{s.title}</p>
                <p className="truncate text-xs text-muted-foreground">{categoryLabel(s.categoryId)}</p>
              </div>
              <MoneyText amount={s.amount} isIncome={isIncome(s.typeId)} />
              {canEdit && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm" aria-label={t('common.actions')}>
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(s)}>
                    <Pencil /> {t('common.edit')}
                  </DropdownMenuItem>
                  <DropdownMenuItem variant="destructive" onClick={() => onDelete(s)}>
                    <Trash2 /> {t('common.delete')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              )}
            </div>
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{t(`scheduled.${s.interval}`)}</Badge>
                <span className="inline-flex items-center gap-1">
                  <CalendarClock className="size-3.5" />
                  {t('scheduled.nextRun')}: {formatDate(s.nextRunDate, locale)}
                </span>
              </div>
              <label className="inline-flex items-center gap-2">
                <span>{s.isActive ? t('scheduled.active') : t('scheduled.paused')}</span>
                <Switch
                  checked={s.isActive}
                  onCheckedChange={(v) => onToggle(s, v)}
                  disabled={!canEdit}
                  aria-label={t('scheduled.active')}
                />
              </label>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
