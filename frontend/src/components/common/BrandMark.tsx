import { useTranslation } from 'react-i18next'
import { cn } from 'cn'
import { StackMark } from './StackMark'

/** App logo: the stack mark in a brand-coloured tile, followed by the app name. */
export function BrandMark({ className }: { className?: string }) {
  const { t } = useTranslation()
  return (
    <span className={cn('flex items-center gap-2.5 font-semibold tracking-tight', className)}>
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm" aria-hidden>
        <StackMark className="size-4.5" />
      </span>
      <span>{t('common.appName')}</span>
    </span>
  )
}
