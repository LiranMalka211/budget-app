import { useTranslation } from 'react-i18next'
import { Section } from './ui'

/** faq: the h2 and a line on the start side, five questions with their answers open on the end side. */
export function Faq() {
  const { t } = useTranslation()
  return (
    <Section id="questions">
      <div className="grid grid-cols-1 gap-y-10 lg:grid-cols-12 lg:gap-x-6">
        <div className="lg:col-span-4">
          <h2 id="questions-h">{t('landing.faq.h2')}</h2>
          <p className="mt-4 text-lg text-muted-foreground">{t('landing.faq.lead')}</p>
        </div>
        <dl className="divide-y divide-border lg:col-span-7 lg:col-start-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="py-5 first:pt-0">
              <dt className="text-lg font-medium">{t(`landing.faq.q${i}`)}</dt>
              <dd className="mt-2 leading-7 text-muted-foreground">{t(`landing.faq.a${i}`)}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Section>
  )
}
