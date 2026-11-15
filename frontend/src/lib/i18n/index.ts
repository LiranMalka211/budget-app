import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import he from './locales/he.json'

/** Languages the UI supports, with their text direction and Intl locale. */
export const LANGUAGES = [
  { code: 'en', label: 'English', dir: 'ltr', locale: 'en-IL' },
  { code: 'he', label: 'עברית', dir: 'rtl', locale: 'he-IL' },
] as const

export type LanguageCode = (typeof LANGUAGES)[number]['code']

/** Returns the metadata for a language code, falling back to English. */
export function getLanguage(code: string) {
  return LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0]
}

/** Initialises i18next with the bundled English and Hebrew resources and browser language detection. */
export function setupI18n() {
  if (i18n.isInitialized) return i18n
  void i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: { en: { translation: en }, he: { translation: he } },
      fallbackLng: 'en',
      supportedLngs: LANGUAGES.map((l) => l.code),
      interpolation: { escapeValue: false },
      detection: { order: ['localStorage', 'navigator'], caches: ['localStorage'] },
    })
  return i18n
}

export default i18n
