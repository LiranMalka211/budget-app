import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'

interface FormFieldProps {
  /** Id of the input inside, so the label is associated with it. */
  id: string
  label: string
  /** Validation message as an i18n key (what the zod schemas produce). */
  error?: string
  /** Interpolation values for the error message, e.g. { count: 8 }. */
  errorValues?: Record<string, unknown>
  description?: string
  optional?: boolean
  children: ReactNode
}

/** Label + control + translated validation error, used by every form in the app. */
export function FormField({ id, label, error, errorValues, description, optional, children }: FormFieldProps) {
  const { t } = useTranslation()
  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor={id}>
        {label}
        {optional && <span className="ms-1 text-xs font-normal text-muted-foreground">({t('common.optional')})</span>}
      </FieldLabel>
      {children}
      {description && !error && <FieldDescription>{description}</FieldDescription>}
      {error && <FieldError>{t(error, { count: 8, ...errorValues })}</FieldError>}
    </Field>
  )
}
