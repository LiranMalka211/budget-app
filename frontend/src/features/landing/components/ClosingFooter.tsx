import { useRef, type CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ROUTES } from '@/app/routes'
import { BrandMark } from '@/components/common/BrandMark'
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { gsap, prefersReducedMotion, useGSAP } from '@/lib/motion/gsap'
import { PrimaryAction } from './ui'

/** Read once when the module loads; the page is never open across a new year long enough to matter. */
const YEAR = new Date().getFullYear()

const LINKS = [
  { href: '#product', key: 'product' },
  { href: '#features', key: 'features' },
  { href: '#family', key: 'family' },
  { href: '#questions', key: 'questions' },
] as const

/**
 * Dealt footer-statement with close-type inside it, and the dealt moment "iris-opens": the slab sits on a new ground;
 * the inset panel in the page ground opens as a disc while the reader scrolls in, and its words appear once it holds them.
 */
export function ClosingFooter({ signedIn }: { signedIn: boolean }) {
  const { t } = useTranslation()
  const scope = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      const tl = gsap.timeline({
        scrollTrigger: { trigger: scope.current, start: 'top 85%', end: 'top 20%', scrub: true },
      })
      tl.fromTo('[data-iris]', { clipPath: 'circle(0% at 50% 50%)' }, { clipPath: 'circle(75% at 50% 50%)', ease: 'none' }).fromTo(
        '[data-iris-content]',
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.3, ease: 'none' },
        '-=0.3',
      )
    },
    { scope, dependencies: [] },
  )

  return (
    <footer ref={scope} id="closing" className="closing screen" style={{ '--h': 1 } as CSSProperties}>
      <div className="flex flex-1 flex-col rounded-3xl bg-[oklch(0.2_0.03_255)] py-3 text-[oklch(0.97_0.01_255)] dark:bg-[oklch(0.1_0.006_60)] dark:ring-1 dark:ring-white/10 sm:py-4">
        <div data-iris className="mx-3 flex flex-1 flex-col justify-center rounded-2xl bg-background py-10 text-foreground sm:mx-4" style={{ clipPath: 'circle(75% at 50% 50%)' }}>
          <div data-iris-content className="wrap closing-inner-panel">
            <h2 id="closing-h" className="max-w-[18ch]">
              {t('landing.closing.h2')}
            </h2>
            <p className="mt-4 text-sm text-muted-foreground">{t('landing.closing.terms')}</p>
            <PrimaryAction to={signedIn ? ROUTES.dashboard : ROUTES.register} size="xl" className="mt-8">
              {signedIn ? t('common.openApp') : t('landing.cta.primary')}
            </PrimaryAction>
          </div>
        </div>
        <div className="wrap closing-inner-slab mt-6 flex flex-col gap-6 pb-2 sm:flex-row sm:items-center sm:justify-between">
          <BrandMark className="text-current" />
          <nav className="flex flex-wrap gap-x-6 gap-y-2" aria-label={t('landing.nav.menu')}>
            {LINKS.map((l) => (
              <a key={l.key} href={l.href} className="link-draw rounded-sm text-sm opacity-80 hover:opacity-100">
                {t(`landing.nav.${l.key}`)}
              </a>
            ))}
            {!signedIn && (
              <Link to={ROUTES.login} className="link-draw rounded-sm text-sm opacity-80 hover:opacity-100">
                {t('landing.nav.login')}
              </Link>
            )}
          </nav>
          <div className="flex items-center gap-1 text-current [&_button]:text-current [&_button:hover]:bg-white/10">
            <ThemeToggle />
            <LanguageSwitcher />
            <span className="ms-3 text-xs opacity-60">© {YEAR} {t('landing.closing.rights')}</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
