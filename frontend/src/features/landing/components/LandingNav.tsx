import { Menu } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ROUTES } from '@/app/routes'
import { BrandMark } from '@/components/common/BrandMark'
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { getLanguage } from '@/lib/i18n'
import { PrimaryAction } from './ui'

const LINKS = [
  { href: '#product', key: 'product' },
  { href: '#features', key: 'features' },
  { href: '#family', key: 'family' },
  { href: '#questions', key: 'questions' },
] as const

/** Dealt nav-centre: the logo on the start line, the four words centred, the actions on the end line. */
export function LandingNav({ signedIn }: { signedIn: boolean }) {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const side = getLanguage(i18n.resolvedLanguage ?? i18n.language).dir === 'rtl' ? 'right' : 'left'
  const primaryTo = signedIn ? ROUTES.dashboard : ROUTES.register
  const primaryLabel = signedIn ? t('common.openApp') : t('landing.cta.primary')

  const words = (onPick?: () => void) =>
    LINKS.map((l) => (
      <a
        key={l.key}
        href={l.href}
        onClick={onPick}
        className="link-draw rounded-sm text-[15px] font-medium text-muted-foreground hover:text-foreground"
      >
        {t(`landing.nav.${l.key}`)}
      </a>
    ))

  return (
    <header className="fixed inset-x-0 top-0 z-40 h-(--nav) border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="wrap grid h-full grid-cols-[minmax(0,1fr)_auto] items-center xl:grid-cols-[1fr_auto_1fr]">
        <Link to={ROUTES.home} className="w-fit rounded-md" aria-label={t('common.home')}>
          <BrandMark />
        </Link>

        <nav className="hidden items-center gap-8 xl:flex" aria-label={t('landing.nav.menu')}>
          {words()}
        </nav>

        <div className="flex items-center justify-end gap-1">
          <ThemeToggle />
          <LanguageSwitcher />
          {!signedIn && (
            <Link
              to={ROUTES.login}
              className="link-draw mx-2 hidden whitespace-nowrap rounded-sm text-[15px] font-medium sm:inline-flex"
            >
              {t('landing.nav.login')}
            </Link>
          )}
          <PrimaryAction to={primaryTo} className="hidden h-10 whitespace-nowrap px-5 sm:inline-flex">
            {primaryLabel}
          </PrimaryAction>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="xl:hidden" aria-label={t('landing.nav.menu')} aria-expanded={open}>
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side={side} className="w-full max-w-sm">
              <SheetHeader>
                <SheetTitle>
                  <BrandMark />
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-4" aria-label={t('landing.nav.menu')}>
                {LINKS.map((l) => (
                  <a key={l.key} href={l.href} onClick={() => setOpen(false)} className="flex min-h-11 items-center rounded-md px-2 text-base font-medium hover:bg-muted">
                    {t(`landing.nav.${l.key}`)}
                  </a>
                ))}
                {!signedIn && (
                  <Link to={ROUTES.login} className="flex min-h-11 items-center rounded-md px-2 text-base font-medium hover:bg-muted">
                    {t('landing.nav.login')}
                  </Link>
                )}
                <PrimaryAction to={primaryTo} className="mt-3">
                  {primaryLabel}
                </PrimaryAction>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
