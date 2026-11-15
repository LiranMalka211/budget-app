import type { ReactNode } from 'react'
import { BrandMark } from '@/components/common/BrandMark'
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
  useDirection()
  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden bg-background px-4 py-6">
      {/* Soft brand glow behind the card; purely decorative. */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(60%_60%_at_50%_0%,color-mix(in_oklch,var(--primary)_16%,transparent),transparent)]"
        aria-hidden
      />
      <div className="relative mx-auto flex w-full max-w-md items-center justify-between">
        <BrandMark />
        <LanguageSwitcher />
      </div>
      <div className="relative flex flex-1 items-center justify-center py-8">
        <Card className="w-full max-w-md shadow-lg shadow-primary/5">
          <CardHeader>
            <CardTitle className="text-2xl font-bold tracking-tight">{title}</CardTitle>
            {subtitle && <CardDescription>{subtitle}</CardDescription>}
          </CardHeader>
          <CardContent>{children}</CardContent>
          {footer && <CardFooter className="justify-center text-sm text-muted-foreground">{footer}</CardFooter>}
        </Card>
      </div>
    </div>
  )
}
