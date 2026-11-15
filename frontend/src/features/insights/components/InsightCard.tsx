import { Sparkles } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/format/dates'
import { useLocale } from '@/lib/i18n/useDirection'
import type { AiInsight } from '@/types'

/** A single AI insight: title, creation date and body text. */
export function InsightCard({ insight }: { insight: AiInsight }) {
  const locale = useLocale()
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="size-4 text-amber-500" />
          {insight.title}
        </CardTitle>
        <CardDescription>{formatDate(insight.createdAt.slice(0, 10), locale)}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed">{insight.body}</p>
      </CardContent>
    </Card>
  )
}
