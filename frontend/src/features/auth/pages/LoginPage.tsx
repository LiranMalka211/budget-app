import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ROUTES } from '@/app/routes'
import { FormField } from '@/components/common/FormField'
import { useApiErrorMessage } from '@/components/common/ErrorState'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { FieldGroup } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { USE_MOCK } from '@/lib/api'
import { useAuth } from '../authStore'
import { AuthCard } from '../components/AuthCard'
import { PasswordField } from '../components/PasswordField'
import { loginSchema, type LoginFormValues } from '../schemas'

/** Login page: email + password form that redirects back to the page the user came from. */
export default function LoginPage() {
  const { t } = useTranslation()
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const toMessage = useApiErrorMessage()
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  /** Submits credentials and navigates to the originally requested page on success. */
  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null)
    try {
      await login(values)
      const from = (location.state as { from?: string } | null)?.from
      navigate(from && from !== ROUTES.login ? from : ROUTES.dashboard, { replace: true })
    } catch (err) {
      setServerError(toMessage(err, 'auth'))
    }
  })

  const { errors, isSubmitting } = form.formState

  return (
    <AuthCard
      title={t('auth.loginTitle')}
      subtitle={t('auth.loginSubtitle')}
      footer={
        <span>
          {t('auth.noAccount')}{' '}
          <Link to={ROUTES.register} className="font-medium text-foreground underline-offset-4 hover:underline">
            {t('auth.register')}
          </Link>
        </span>
      }
    >
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
          <FormField id="password" label={t('auth.password')} error={errors.password?.message}>
            <PasswordField id="password" autoComplete="current-password" {...form.register('password')} />
          </FormField>
          <div className="-mt-2 text-end text-sm">
            <Link to={ROUTES.forgotPassword} className="text-muted-foreground underline-offset-4 hover:underline">
              {t('auth.forgotPassword')}
            </Link>
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" />}
            {t('auth.login')}
          </Button>
          {USE_MOCK && <p className="text-center text-xs text-muted-foreground">{t('auth.demoHint')}</p>}
        </FieldGroup>
      </form>
    </AuthCard>
  )
}
