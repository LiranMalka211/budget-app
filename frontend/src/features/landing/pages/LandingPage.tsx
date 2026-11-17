/*
 * Deal (taste-skill, 2026-11-16): hero collage · palette: light = brand blue on frosted white (start.mjs brand),
 * dark = lunar-grey-bronze stepped to a glowing orange · type Outfit (+ Heebo for Hebrew) · moment iris-opens (closing)
 * + the GSAP walkthrough · nav-centre · footer-statement · close-type · rhythm space · buttons arrow · mark stack.
 * Kind: software. Main action: "Create a free account".
 */
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/features/auth/authStore'
import { useDirection } from '@/lib/i18n/useDirection'
import { ClosingFooter } from '../components/ClosingFooter'
import { Faq } from '../components/Faq'
import { FamilySection } from '../components/FamilySection'
import { Features } from '../components/Features'
import { FlowSection } from '../components/FlowSection'
import { Hero } from '../components/Hero'
import { LandingNav } from '../components/LandingNav'
import { ProductSection } from '../components/ProductSection'
import { Walkthrough } from '../components/Walkthrough'
import '../landing.css'

/** Public home page: one section per screen, the product's own UI in the hero, the frame and the walkthrough. */
export default function LandingPage() {
  const { t } = useTranslation()
  const { status } = useAuth()
  const signedIn = status === 'authenticated'
  useDirection()

  // Page metadata per language, and the page type the design checker reads from <html>.
  useEffect(() => {
    document.title = t('landing.meta.title')
    const meta = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    if (meta) meta.content = t('landing.meta.description')
    document.documentElement.dataset.type = 'software'
    return () => {
      delete document.documentElement.dataset.type
    }
  }, [t])

  return (
    <div className="landing">
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-primary px-3 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:outline-2 focus:outline-offset-2 focus:outline-foreground"
      >
        {t('common.skipToContent')}
      </a>
      <LandingNav signedIn={signedIn} />
      <main id="main">
        <Hero signedIn={signedIn} />
        <ProductSection />
        <Walkthrough />
        <Features />
        <FamilySection />
        <FlowSection />
        <Faq />
      </main>
      <ClosingFooter signedIn={signedIn} />
    </div>
  )
}
