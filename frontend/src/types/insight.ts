/** Languages insights are written in (the UI languages). */
export type InsightLanguage = 'en' | 'he'

/** An AI-generated recommendation. Mirrors the `ai_insights` table. */
export interface AiInsight {
  id: string
  title: string
  body: string
  /** The language the text is written in; every generation is stored once per language. */
  language: InsightLanguage
  userId: string
  createdAt: string
}
