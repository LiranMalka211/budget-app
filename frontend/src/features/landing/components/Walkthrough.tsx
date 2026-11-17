import { useRef, useState, type CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from 'cn'
import { prefersReducedMotion, ScrollTrigger, useGSAP } from '@/lib/motion/gsap'
import { AppFrame, type AppView } from './AppFrame'

const VIEWS: AppView[] = ['list', 'edit', 'dashboard']

/**
 * The page's scroll moment: two screens where the window beside the steps changes as the reader scrolls
 * (import, categories, dashboard). ScrollTrigger only reports progress for this section; nothing is pinned.
 */
export function Walkthrough() {
  const { t } = useTranslation()
  const scope = useRef<HTMLElement>(null)
  const [step, setStep] = useState(0)

  useGSAP(
    () => {
      if (prefersReducedMotion()) {
        setStep(2)
        return
      }
      ScrollTrigger.create({
        trigger: scope.current,
        start: 'top 55%',
        end: 'bottom 70%',
        onUpdate: (self) => setStep(Math.min(2, Math.floor(self.progress * 3))),
      })
      void document.fonts.ready.then(() => ScrollTrigger.refresh())
    },
    { scope, dependencies: [] },
  )

  return (
    <section id="walkthrough" ref={scope} className="screen" style={{ '--h': 2, '--hm': 2 } as CSSProperties} aria-labelledby="walkthrough-h">
      <div className="wrap flex h-full flex-col">
        <h2 id="walkthrough-h" className="max-w-3xl">
          {t('landing.walkthrough.h2')}
        </h2>
        <div className="mt-10 grid flex-1 grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-x-6">
          <ol className="flex flex-col justify-around gap-10 lg:col-span-4 lg:gap-0">
            {VIEWS.map((_, i) => (
              <li key={i} className="flex gap-4">
                <span
                  className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors duration-300',
                    step === i ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                  )}
                  aria-hidden
                >
                  {i + 1}
                </span>
                <div>
                  <h3 className={cn('text-xl font-medium transition-colors duration-300', step === i ? 'text-foreground' : 'text-muted-foreground')}>
                    {t(`landing.walkthrough.step${i + 1}Title`)}
                  </h3>
                  <p className="mt-2 leading-7 text-muted-foreground">{t(`landing.walkthrough.step${i + 1}Body`)}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="min-w-0 lg:col-span-8">
            <div className="fade-b h-[460px] lg:sticky lg:top-[calc(var(--nav)+40px)] lg:h-[560px]">
              <AppFrame view={VIEWS[step]} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
