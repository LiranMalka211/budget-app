import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCategories, useCategoryLabel, useCreateCategory } from '@/hooks/useLookups'

/** Sentinel value for the "all categories" option (Radix Select forbids empty strings). */
export const ALL_CATEGORIES = 'all'
const NEW_CATEGORY = '__new__'

interface CategorySelectProps {
  id?: string
  value: string
  onChange: (categoryId: string) => void
  /** Only show categories of this transaction type. */
  typeId?: string
  /** Adds an "All categories" option (for filters). */
  allowAll?: boolean
  /** Adds a "New category" option that opens a small create dialog. */
  allowCreate?: boolean
  className?: string
}

/** Dropdown of categories filtered by type, with optional "all" and inline "create new" options. */
export function CategorySelect({ id, value, onChange, typeId, allowAll, allowCreate, className }: CategorySelectProps) {
  const { t } = useTranslation()
  const { data: categories = [] } = useCategories()
  const label = useCategoryLabel()
  const createCategory = useCreateCategory()
  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState('')

  const options = useMemo(
    () => categories.filter((c) => !typeId || c.typeId === typeId),
    [categories, typeId],
  )

  /** Handles selection, intercepting the "new category" sentinel. */
  const handleChange = (next: string) => {
    if (next === NEW_CATEGORY) {
      setCreateOpen(true)
      return
    }
    onChange(next)
  }

  /** Creates the category, selects it and closes the dialog. */
  const handleCreate = async () => {
    if (!newName.trim() || !typeId) return
    try {
      const created = await createCategory.mutateAsync({ name: newName.trim(), typeId })
      onChange(created.id)
      setNewName('')
      setCreateOpen(false)
    } catch {
      toast.error(t('errors.generic'))
    }
  }

  return (
    <>
      <Select value={value || undefined} onValueChange={handleChange}>
        <SelectTrigger id={id} className={className ?? 'w-full'}>
          <SelectValue placeholder={allowAll ? t('transactions.allCategories') : t('transactions.selectCategory')} />
        </SelectTrigger>
        <SelectContent>
          {allowAll && <SelectItem value={ALL_CATEGORIES}>{t('transactions.allCategories')}</SelectItem>}
          {options.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {label(c)}
            </SelectItem>
          ))}
          {allowCreate && typeId && (
            <>
              <SelectSeparator />
              <SelectItem value={NEW_CATEGORY}>
                <Plus className="size-4" /> {t('transactions.newCategory')}
              </SelectItem>
            </>
          )}
        </SelectContent>
      </Select>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('transactions.newCategory')}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="new-category-name">{t('transactions.categoryName')}</Label>
            <Input
              id="new-category-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void handleCreate()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={() => void handleCreate()} disabled={!newName.trim() || createCategory.isPending}>
              {t('transactions.addCategory')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
