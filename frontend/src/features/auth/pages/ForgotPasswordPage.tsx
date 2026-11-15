import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, MailCheck } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ROUTES, resetPasswordPath } from '@/app/routes'
import { FormField } from '@/components/common/FormField'
import { useApiErrorMessage } from '@/components/common/ErrorState'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { FieldGroup } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { authApi } from '../authApi'
import { AuthCard } from '../components/AuthCard'
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '../schemas'

/** Forgot-password page: asks for an email and confirms that a reset link was sent. */
export default function ForgotPasswordPage() {
  const { t } = useTranslation()
  const toMessage = useApiErrorMessage()
  const [sent, setSent] = useState(false)
  const [mockToken, setMockToken] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  /** Requests the reset email; in mock mode the token comes back so the link can be followed locally. */
  const onSubmit = form.handleSubmit(async ({ email }) => {
    setServerError(null)
    try {
      const res = await authApi.forgotPassword(email)
      setMockToken(res.resetToken ?? null)
      setSent(true)
    } catch (err) {
      setServerError(toMessage(err, 'auth'))
    }
  })

  const { errors, isSubmitting } = form.formState

  return (
    <AuthCard
      title={t('auth.forgotTitle')}
      subtitle={t('auth.forgotSubtitle')}
      footer={
        <Link to={ROUTES.login} className="font-medium text-foreground underline-offset-4 hover:underline">
          {t('auth.backToLogin')}
        </Link>
      }
    >
      {sent ? (
        <Alert>
          <MailCheck />
          <AlertTitle>{t('auth.resetLinkSent')}</AlertTitle>
          {mockToken && (
            <AlertDescription>
              <Link to={resetPasswordPath(mockToken)} className="underline">
                {t('auth.resetLinkMock')}
              </Link>
            </AlertDescription>
          )}
        </Alert>
      ) : (
        <form onSubmit={onSubmit} noValidate>
          <FieldGroup>
            {serverError && (
              <Alert variant="destructive">
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            )}
            <FormField id="email" label={t('auth.email')} error={errors.email?.message}>
              <Input id="email" type="email" autoComplete="email" {...form.register('email')} />
            </FormField>
            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              {t('auth.sendResetLink')}
            </Button>
          </FieldGroup>
        </form>
      )}
    </AuthCard>
  )
}
