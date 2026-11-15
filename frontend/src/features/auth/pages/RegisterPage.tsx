import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { ROUTES } from '@/app/routes'
import { FormField } from '@/components/common/FormField'
import { useApiErrorMessage } from '@/components/common/ErrorState'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { FieldGroup } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useAuth } from '../authStore'
import { AuthCard } from '../components/AuthCard'
import { PasswordField } from '../components/PasswordField'
import { registerSchema, type RegisterFormValues } from '../schemas'

/** Registration page: collects name, email and password and logs the new user in. */
export default function RegisterPage() {
  const { t } = useTranslation()
  const { register: registerUser } = useAuth()
  const navigate = useNavigate()
  const toMessage = useApiErrorMessage()
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { firstName: '', lastName: '', email: '', password: '', confirmPassword: '' },
  })

  /** Creates the account and sends the user to the dashboard. */
  const onSubmit = form.handleSubmit(async ({ confirmPassword: _confirm, ...values }) => {
    setServerError(null)
    try {
      await registerUser(values)
      navigate(ROUTES.dashboard, { replace: true })
    } catch (err) {
      setServerError(toMessage(err, 'auth'))
    }
  })

  const { errors, isSubmitting } = form.formState

  return (
    <AuthCard
      title={t('auth.registerTitle')}
      subtitle={t('auth.registerSubtitle')}
      footer={
        <span>
          {t('auth.haveAccount')}{' '}
          <Link to={ROUTES.login} className="font-medium text-foreground underline-offset-4 hover:underline">
            {t('auth.login')}
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
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="firstName" label={t('auth.firstName')} error={errors.firstName?.message}>
              <Input id="firstName" autoComplete="given-name" {...form.register('firstName')} />
            </FormField>
            <FormField id="lastName" label={t('auth.lastName')} error={errors.lastName?.message}>
              <Input id="lastName" autoComplete="family-name" {...form.register('lastName')} />
            </FormField>
          </div>
          <FormField id="email" label={t('auth.email')} error={errors.email?.message}>
            <Input id="email" type="email" autoComplete="email" {...form.register('email')} />
          </FormField>
          <FormField id="password" label={t('auth.password')} error={errors.password?.message}>
            <PasswordField id="password" autoComplete="new-password" {...form.register('password')} />
          </FormField>
          <FormField id="confirmPassword" label={t('auth.confirmPassword')} error={errors.confirmPassword?.message}>
            <PasswordField id="confirmPassword" autoComplete="new-password" {...form.register('confirmPassword')} />
          </FormField>
          <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" />}
            {t('auth.register')}
          </Button>
        </FieldGroup>
      </form>
    </AuthCard>
  )
}
