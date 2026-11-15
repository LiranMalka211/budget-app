import { Wallet } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useDirection } from '@/lib/i18n/useDirection'

interface AuthCardProps {
  title: string
  subtitle?: string
  children: ReactNode
  /** Links rendered under the form, e.g. "Don't have an account?". */
  footer?: ReactNode
}

/** Centered card layout shared by the login, register and password pages. */
export function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  const { t } = useTranslation()
  useDirection()
  return (
    <div className="flex min-h-svh flex-col bg-muted/40 px-4 py-6">
      <div className="mx-auto flex w-full max-w-md items-center justify-between">
        <div className="flex items-center gap-2 font-semibold">
          <Wallet className="size-5" />
          <span>{t('common.appName')}</span>
        </div>
        <LanguageSwitcher />
      </div>
      <div className="flex flex-1 items-center justify-center py-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-xl">{title}</CardTitle>
            {subtitle && <CardDescription>{subtitle}</CardDescription>}
          </CardHeader>
          <CardContent>{children}</CardContent>
          {footer && <CardFooter className="justify-center text-sm text-muted-foreground">{footer}</CardFooter>}
        </Card>
      </div>
    </div>
  )
}
