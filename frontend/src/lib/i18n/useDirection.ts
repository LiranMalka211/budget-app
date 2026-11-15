import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { getLanguage } from './index'

/** Keeps `<html lang dir>` in sync with the active language so Tailwind logical properties flip for Hebrew. */
export function useDirection() {
  const { i18n } = useTranslation()
  const lang = getLanguage(i18n.resolvedLanguage ?? i18n.language)
  useEffect(() => {
    document.documentElement.lang = lang.code
    document.documentElement.dir = lang.dir
  }, [lang])
  return lang
}

/** Returns the Intl locale string (e.g. "he-IL") for number and date formatting. */
export function useLocale(): string {
  const { i18n } = useTranslation()
  return getLanguage(i18n.resolvedLanguage ?? i18n.language).locale
}
