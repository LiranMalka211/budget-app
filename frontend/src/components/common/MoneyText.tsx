import { cn } from 'cn'
import { useLocale } from '@/lib/i18n/useDirection'
import { formatMoney, formatSignedMoney } from '@/lib/format/money'

interface MoneyTextProps {
  amount: number
  /** When provided, renders a +/- prefix and colours income green and expense red. */
  isIncome?: boolean
  className?: string
}

/** Displays an amount as localised currency, optionally signed and coloured by type. */
export function MoneyText({ amount, isIncome, className }: MoneyTextProps) {
  const locale = useLocale()
  if (isIncome === undefined) {
    return <span className={cn('tabular-nums', className)}>{formatMoney(amount, locale)}</span>
  }
  return (
    <span
      className={cn(
        'tabular-nums font-medium',
        isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400',
        className,
      )}
    >
      {formatSignedMoney(amount, isIncome, locale)}
    </span>
  )
}
