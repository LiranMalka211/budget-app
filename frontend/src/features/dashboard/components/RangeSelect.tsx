import { CalendarRange } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RANGE_PRESETS, type RangePreset } from '../rangePresets'

interface RangeSelectProps {
  value: RangePreset
  onChange: (preset: RangePreset) => void
}

/** Date-range preset picker; sits in the filter row and scopes everything on the dashboard. */
export function RangeSelect({ value, onChange }: RangeSelectProps) {
  const { t } = useTranslation()
  return (
    <Select value={value} onValueChange={(v) => onChange(v as RangePreset)}>
      <SelectTrigger className="w-full sm:w-48" aria-label={t('common.date')}>
        <CalendarRange className="size-4 text-muted-foreground" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {RANGE_PRESETS.map((p) => (
          <SelectItem key={p} value={p}>
            {t(`dashboard.ranges.${p}`)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
