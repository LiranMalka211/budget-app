import { AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { ApiError } from '@/types'

interface ErrorStateProps {
  error: unknown
  onRetry?: () => void
}

/** Maps an unknown error to a translation key; feature-specific codes resolve under `<scope>.errors.<code>`. */
export function errorMessageKey(error: unknown, scope?: string): string {
  if (error instanceof ApiError) {
    if (error.code === 'edit_not_allowed') return 'errors.editNotAllowed'
    if (error.code && scope) return `${scope}.errors.${error.code}`
    if (error.status === 0) return 'errors.network'
    if (error.status === 401) return 'errors.unauthorized'
    if (error.status === 403) return 'errors.forbidden'
    if (error.status === 404) return 'errors.notFound'
  }
  return 'errors.generic'
}

/** Inline error block with an optional retry button, used when a query fails. */
export function ErrorState({ error, onRetry }: ErrorStateProps) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
      <AlertTriangle className="size-6 text-destructive" />
      <p className="text-sm">{t(errorMessageKey(error))}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          {t('common.retry')}
        </Button>
      )}
    </div>
  )
}

/** Returns a function that turns any error into a translated, user-facing message (optionally scoped, e.g. "auth"). */
export function useApiErrorMessage() {
  const { t } = useTranslation()
  return (error: unknown, scope?: string): string =>
    t(errorMessageKey(error, scope), { defaultValue: t('errors.generic') })
}
