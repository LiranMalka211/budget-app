import { ArrowRight, CheckCircle2, Loader2, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { cn } from 'cn'
import { ROUTES } from '@/app/routes'
import { useApiErrorMessage } from '@/components/common/ErrorState'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { ColumnMapping, ImportResult, ImportSource, NormalizedRow, RawRow } from '@/types'
import { ColumnMapper } from '../components/ColumnMapper'
import { FileDropzone } from '../components/FileDropzone'
import { ImportPreviewTable } from '../components/ImportPreviewTable'
import { type AmountMode, guessMapping, modeFor } from '../parsers/bankPresets'
import { normalizeRows } from '../parsers/normalizeRows'
import { MAX_FILE_SIZE, parseFile } from '../parsers/parseFile'
import { useCommitImport } from '../useImport'

type Step = 'upload' | 'map' | 'review' | 'done'
const STEPS: Step[] = ['upload', 'map', 'review', 'done']

/** Horizontal step indicator for the import wizard. */
function StepIndicator({ current }: { current: Step }) {
  const { t } = useTranslation()
  const idx = STEPS.indexOf(current)
  return (
    <ol className="flex items-center gap-2 text-sm">
      {STEPS.map((s, i) => (
        <li key={s} className="flex items-center gap-2">
          <span
            className={cn(
              'flex size-6 items-center justify-center rounded-full text-xs font-medium',
              i <= idx ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
            )}
          >
            {i + 1}
          </span>
          <span className={cn('hidden sm:inline', i === idx ? 'font-medium' : 'text-muted-foreground')}>
            {t(`import.step${s.charAt(0).toUpperCase()}${s.slice(1)}`)}
          </span>
          {i < STEPS.length - 1 && <span className="h-px w-6 bg-border" />}
        </li>
      ))}
    </ol>
  )
}

/** Import wizard: upload a bank/credit file, map its columns, review rows with categories, then commit. */
export default function ImportPage() {
  const { t } = useTranslation()
  const toMessage = useApiErrorMessage()
  const commit = useCommitImport()

  const [step, setStep] = useState<Step>('upload')
  const [fileName, setFileName] = useState('')
  const [headers, setHeaders] = useState<string[]>([])
  const [rawRows, setRawRows] = useState<RawRow[]>([])
  const [source, setSource] = useState<ImportSource>('bank')
  const [mapping, setMapping] = useState<ColumnMapping>({ date: null, title: null, amount: null, debit: null, credit: null })
  const [amountMode, setAmountMode] = useState<AmountMode>('single')
  const [rows, setRows] = useState<NormalizedRow[]>([])
  const [result, setResult] = useState<ImportResult | null>(null)
  const [parsing, setParsing] = useState(false)

  /** Parses the chosen file in the browser and moves to the mapping step. */
  const handleFile = async (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      toast.error(t('import.dropzoneHint'))
      return
    }
    setParsing(true)
    try {
      const parsed = await parseFile(file)
      if (parsed.rows.length === 0) {
        toast.error(t('import.noRows'))
        return
      }
      setFileName(file.name)
      setHeaders(parsed.headers)
      setRawRows(parsed.rows)
      applyGuess(guessMapping(parsed.headers, source))
      setStep('map')
    } catch {
      toast.error(t('import.parseError'))
    } finally {
      setParsing(false)
    }
  }

  /** Re-guesses the mapping when the source changes, since credit files are shaped differently. */
  const handleSourceChange = (s: ImportSource) => {
    setSource(s)
    applyGuess(guessMapping(headers, s))
  }

  /** Uses an auto-detected mapping and the amount mode that matches it. */
  function applyGuess(guess: ColumnMapping) {
    setMapping(guess)
    setAmountMode(modeFor(guess))
  }

  /** Applies the mapping and moves to the review step. */
  const goToReview = () => {
    setRows(normalizeRows(rawRows, mapping, source))
    setStep('review')
  }

  /** Sends the valid rows to the server. */
  const handleCommit = async () => {
    const valid = rows.filter((r) => !r.invalid)
    try {
      const res = await commit.mutateAsync({
        fileName,
        source,
        rows: valid.map((r) => ({ date: r.date, title: r.title, amount: r.amount, type: r.type, categoryId: r.categoryId ?? '' })),
      })
      setResult(res)
      setStep('done')
    } catch (err) {
      toast.error(toMessage(err))
    }
  }

  /** Clears everything and returns to the upload step. */
  const reset = () => {
    setStep('upload')
    setFileName('')
    setHeaders([])
    setRawRows([])
    setRows([])
    setResult(null)
  }

  const amountMapped = amountMode === 'single' ? Boolean(mapping.amount) : Boolean(mapping.debit || mapping.credit)
  const mappingComplete = Boolean(mapping.date && mapping.title && amountMapped)
  const validCount = rows.filter((r) => !r.invalid).length

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t('import.title')} subtitle={t('import.subtitle')} actions={<StepIndicator current={step} />} />

      {step === 'upload' && (
        <Card>
          <CardContent>
            {parsing ? (
              <div className="flex items-center justify-center gap-2 p-10 text-muted-foreground">
                <Loader2 className="size-5 animate-spin" /> {t('common.loading')}
              </div>
            ) : (
              <FileDropzone onFile={(f) => void handleFile(f)} />
            )}
          </CardContent>
        </Card>
      )}

      {step === 'map' && (
        <Card>
          <CardContent className="flex flex-col gap-6">
            <div>
              <h2 className="font-medium">{t('import.mapColumns')}</h2>
              <p className="text-sm text-muted-foreground">
                {fileName} · {t('import.mapHint')}
              </p>
            </div>
            <ColumnMapper headers={headers} value={mapping} onChange={setMapping} source={source} onSourceChange={handleSourceChange}
              mode={amountMode}
              onModeChange={setAmountMode}
            />
            <div className="flex justify-between">
              <Button variant="outline" onClick={reset}>
                {t('common.back')}
              </Button>
              <Button onClick={goToReview} disabled={!mappingComplete}>
                {t('import.continue')} <ArrowRight className="rtl:rotate-180" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'review' && (
        <Card>
          <CardContent className="flex flex-col gap-6">
            <ImportPreviewTable
              rows={rows}
              onCategoryChange={(key, categoryId) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, categoryId } : r)))}
              onApplyToAllExpenses={(categoryId) =>
                setRows((rs) => rs.map((r) => (!r.invalid && r.type === 'expense' ? { ...r, categoryId } : r)))
              }
            />
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('map')}>
                {t('common.back')}
              </Button>
              <Button onClick={() => void handleCommit()} disabled={validCount === 0 || commit.isPending}>
                {commit.isPending && <Loader2 className="animate-spin" />}
                {commit.isPending ? t('import.importing') : t('import.commit', { count: validCount })}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'done' && result && (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <CheckCircle2 className="size-10 text-emerald-600" />
            <div>
              <p className="text-lg font-semibold">{t('import.done')}</p>
              <p className="text-sm text-muted-foreground">
                {t('import.inserted', { count: result.inserted })} · {t('import.skipped', { count: result.skippedDuplicates })}
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <Button asChild>
                <Link to={ROUTES.transactions}>{t('nav.transactions')}</Link>
              </Button>
              <Button variant="outline" onClick={reset}>
                <RotateCcw /> {t('import.startOver')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
