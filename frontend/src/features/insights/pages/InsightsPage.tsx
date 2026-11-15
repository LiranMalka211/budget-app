import { Loader2, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState, useApiErrorMessage } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { InsightCard } from '../components/InsightCard'
import { useGenerateInsights, useInsightsList } from '../useInsights'

/** Insights page: list of AI recommendations and a button that requests fresh ones. */
export default function InsightsPage() {
  const { t } = useTranslation()
  const toMessage = useApiErrorMessage()
  const query = useInsightsList()
  const generate = useGenerateInsights()

  /** Requests new insights and shows progress/outcome toasts. */
  const handleGenerate = async () => {
    try {
      await generate.mutateAsync()
      toast.success(t('insights.generated'))
    } catch (err) {
      toast.error(toMessage(err))
    }
  }

  const generateButton = (
    <Button onClick={() => void handleGenerate()} disabled={generate.isPending}>
      {generate.isPending ? <Loader2 className="animate-spin" /> : <Sparkles />}
      {generate.isPending ? t('insights.generating') : t('insights.generate')}
    </Button>
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t('insights.title')} subtitle={t('insights.subtitle')} actions={generateButton} />

      {query.isPending ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : query.data.length === 0 ? (
        <EmptyState icon={Sparkles} title={t('insights.empty')} description={t('insights.emptyHint')} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {query.data.map((i) => (
            <InsightCard key={i.id} insight={i} />
          ))}
        </div>
      )}
    </div>
  )
}
