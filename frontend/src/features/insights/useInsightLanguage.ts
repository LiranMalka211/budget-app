import { useTranslation } from 'react-i18next'
import { getLanguage } from '@/lib/i18n'
import type { AiInsight } from '@/types'

/**
 * Keeps the insights written in the active UI language. Each generation is stored once per language,
 * so switching language swaps the text without asking the server again.
 */
export function useInsightsInLanguage(insights: AiInsight[] | undefined): AiInsight[] {
  const { i18n } = useTranslation()
  const code = getLanguage(i18n.resolvedLanguage ?? i18n.language).code
  return (insights ?? []).filter((i) => (i.language ?? 'en') === code)
}
