import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, LogOut } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useApiErrorMessage } from '@/components/common/ErrorState'
import { FormField } from '@/components/common/FormField'
import { PageHeader } from '@/components/common/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FieldGroup } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { authApi } from '@/features/auth/authApi'
import { useAuth } from '@/features/auth/authStore'
import { profileSchema, type ProfileFormValues } from '@/features/auth/schemas'
import { USE_MOCK } from '@/lib/api'
import { LANGUAGES } from '@/lib/i18n'

/** Settings page: profile name, UI language and account actions. */
export default function SettingsPage() {
  const { t, i18n } = useTranslation()
  const { user, setUser, logout } = useAuth()
  const toMessage = useApiErrorMessage()

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { firstName: user?.firstName ?? '', lastName: user?.lastName ?? '' },
  })

  /** Saves the profile and updates the cached user. */
  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const updated = await authApi.updateProfile(values)
      setUser(updated)
      toast.success(t('settings.profileSaved'))
    } catch (err) {
      toast.error(toMessage(err))
    }
  })

  const { errors, isSubmitting } = form.formState
  const currentLang = i18n.resolvedLanguage ?? i18n.language

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t('settings.title')}
        subtitle={t('settings.subtitle')}
        actions={USE_MOCK && <Badge variant="secondary">{t('settings.mockBadge')}</Badge>}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('settings.profile')}</CardTitle>
            <CardDescription>{user?.email}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} noValidate>
              <FieldGroup>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField id="firstName" label={t('auth.firstName')} error={errors.firstName?.message}>
                    <Input id="firstName" {...form.register('firstName')} />
                  </FormField>
                  <FormField id="lastName" label={t('auth.lastName')} error={errors.lastName?.message}>
                    <Input id="lastName" {...form.register('lastName')} />
                  </FormField>
                </div>
                <div>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="animate-spin" />}
                    {t('settings.saveProfile')}
                  </Button>
                </div>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.language')}</CardTitle>
              <CardDescription>{t('settings.languageHint')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={currentLang} onValueChange={(v) => void i18n.changeLanguage(v)}>
                <SelectTrigger className="w-full sm:w-60" aria-label={t('settings.language')}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((l) => (
                    <SelectItem key={l.code} value={l.code}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('settings.account')}</CardTitle>
              {USE_MOCK && <CardDescription>{t('settings.mockHint')}</CardDescription>}
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={logout}>
                <LogOut /> {t('nav.logout')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
