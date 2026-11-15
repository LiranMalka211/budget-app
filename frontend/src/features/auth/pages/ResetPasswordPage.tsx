import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ROUTES } from '@/app/routes'
import { FormField } from '@/components/common/FormField'
import { useApiErrorMessage } from '@/components/common/ErrorState'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { FieldGroup } from '@/components/ui/field'
import { authApi } from '../authApi'
import { AuthCard } from '../components/AuthCard'
import { PasswordField } from '../components/PasswordField'
import { resetPasswordSchema, type ResetPasswordFormValues } from '../schemas'

/** Reset-password page: reads the token from the URL and lets the user set a new password. */
export default function ResetPasswordPage() {
  const { t } = useTranslation()
  const { token = '' } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const toMessage = useApiErrorMessage()
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  /** Saves the new password and returns to the login page. */
  const onSubmit = form.handleSubmit(async ({ password }) => {
    setServerError(null)
    try {
      await authApi.resetPassword(token, password)
      toast.success(t('auth.passwordUpdated'))
      navigate(ROUTES.login, { replace: true })
    } catch (err) {
      setServerError(toMessage(err, 'auth'))
    }
  })

  const { errors, isSubmitting } = form.formState

  return (
    <AuthCard
      title={t('auth.resetTitle')}
      subtitle={t('auth.resetSubtitle')}
      footer={
        <Link to={ROUTES.login} className="font-medium text-foreground underline-offset-4 hover:underline">
          {t('auth.backToLogin')}
        </Link>
      }
    >
      <form onSubmit={onSubmit} noValidate>
        <FieldGroup>
          {serverError && (
            <Alert variant="destructive">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}
          <FormField id="password" label={t('auth.newPassword')} error={errors.password?.message}>
            <PasswordField id="password" autoComplete="new-password" {...form.register('password')} />
          </FormField>
          <FormField id="confirmPassword" label={t('auth.confirmPassword')} error={errors.confirmPassword?.message}>
            <PasswordField id="confirmPassword" autoComplete="new-password" {...form.register('confirmPassword')} />
          </FormField>
          <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" />}
            {t('auth.resetPassword')}
          </Button>
        </FieldGroup>
      </form>
    </AuthCard>
  )
}
