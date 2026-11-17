import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { ROUTES } from '@/app/routes'
import { formatMoney } from '@/lib/format/money'
import { useLocale } from '@/lib/i18n/useDirection'
import { ENTER_EASE, gsap, prefersReducedMotion, useGSAP } from '@/lib/motion/gsap'
import { AppFrame } from './AppFrame'
import { DEMO_TOTALS } from './demoData'
import { PrimaryAction, SecondaryAction } from './ui'

/** The small result card over the window's lower corner: what is left this month. */
function ResultCard() {
  const { t } = useTranslation()
  const locale = useLocale()
  const left = DEMO_TOTALS.income - DEMO_TOTALS.expense
  const money = (n: number) => formatMoney(n, locale, undefined, { maximumFractionDigits: 0 })
  return (
    <div data-rise-media className="glow-card absolute bottom-8 start-16 hidden w-[300px] rounded-xl bg-card p-4 text-card-foreground lg:block">
      <p className="text-xs text-muted-foreground">{t('landing.hero.cardTitle')}</p>
      <p className="mt-1 text-sm">{t('landing.hero.cardLeft')}</p>
      <p className="text-3xl font-semibold tracking-tight tabular-nums">{money(left)}</p>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div>
          <dt className="text-muted-foreground">{t('landing.hero.cardIncome')}</dt>
          <dd className="font-medium text-income tabular-nums">+{money(DEMO_TOTALS.income)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{t('landing.hero.cardExpense')}</dt>
          <dd className="font-medium text-expense tabular-nums">-{money(DEMO_TOTALS.expense)}</dd>
        </div>
      </dl>
    </div>
  )
}

/**
 * Dealt hero "collage": the text on the start side (five columns), the app window on a lit frame across the end
 * six columns, cut by the frame's end and bottom edges, one small result card over its lower corner.
 * The headline rises line by line once on load (GSAP), then the lead, buttons and the frame follow.
 */
export function Hero({ signedIn }: { signedIn: boolean }) {
  const { t } = useTranslation()
  const scope = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      const tl = gsap.timeline({ defaults: { ease: ENTER_EASE } })
      tl.from('[data-line]', { y: 28, autoAlpha: 0, duration: 0.7, stagger: 0.12 })
        .from('[data-rise]', { y: 12, autoAlpha: 0, duration: 0.45, stagger: 0.08 }, '-=0.45')
        .from('[data-rise-media]', { y: 16, autoAlpha: 0, duration: 0.6, stagger: 0.1 }, '<')
    },
    { scope, dependencies: [] },
  )

  return (
    <section id="hero" ref={scope} className="screen hero" data-enter aria-labelledby="hero-h">
      <div className="wrap flex flex-col gap-8 lg:grid lg:grid-cols-12 lg:items-stretch lg:gap-x-6">
        <div className="flex flex-col lg:col-span-5 lg:self-start">
          <h1 id="hero-h">
            <span data-line className="block">
              {t('landing.hero.line1')}
            </span>
            <span data-line className="block">
              {t('landing.hero.line2')}
            </span>
            <span data-line className="block text-primary">
              {t('landing.hero.line3')}
            </span>
          </h1>
          <p data-rise className="mt-5 max-w-[46ch] text-lg leading-7 text-muted-foreground md:mt-6 md:text-xl md:leading-[30px]">
            {t('landing.hero.lead')}
          </p>
          <div data-rise className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 md:mt-8">
            <PrimaryAction to={signedIn ? ROUTES.dashboard : ROUTES.register}>{signedIn ? t('common.openApp') : t('landing.cta.primary')}</PrimaryAction>
            <SecondaryAction to="#product">{t('landing.cta.secondary')}</SecondaryAction>
          </div>
          <p data-rise className="mt-4 text-sm text-muted-foreground md:mt-6">
            {t('landing.hero.fact')}
          </p>
        </div>

        <div
          data-rise-media
          className="lit-ground relative min-h-[200px] w-full flex-1 overflow-hidden rounded-2xl lg:col-span-6 lg:col-start-7 lg:h-full lg:max-h-[716px] lg:max-w-[628px] lg:justify-self-end"
        >
          <div className="absolute start-4 top-4 h-[calc(100%-16px)] w-[calc(100%-16px+28px)] lg:start-16 lg:top-16 lg:h-[calc(100%-64px)] lg:w-[calc(100%-64px+28px)]">
            <div className="fade-b h-full">
              <AppFrame view="list" compact />
            </div>
          </div>
          <ResultCard />
        </div>
      </div>
    </section>
  )
}
