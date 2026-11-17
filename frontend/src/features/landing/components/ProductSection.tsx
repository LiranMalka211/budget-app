import { useTranslation } from 'react-i18next'
import { AppFrame } from './AppFrame'
import { Section } from './ui'

/** app-frame: the product big, one window across the container, the list beside the open item. */
export function ProductSection() {
  const { t } = useTranslation()
  return (
    <Section id="product">
      <div className="flex h-full flex-col">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-x-6">
          <h2 id="product-h" className="lg:col-span-5">
            {t('landing.product.h2')}
          </h2>
          <p className="text-lg leading-7 text-muted-foreground lg:col-span-6 lg:col-start-7">
            {t('landing.product.lead')}{' '}
            <a href="#family" className="link-draw font-medium text-foreground">
              {t('landing.product.link')}
            </a>
          </p>
        </div>
        <div className="fade-b mt-12 min-h-[420px] flex-1 lg:min-h-0">
          <AppFrame view="list" />
        </div>
      </div>
    </Section>
  )
}
