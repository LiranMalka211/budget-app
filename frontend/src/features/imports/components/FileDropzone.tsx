import { FileUp } from 'lucide-react'
import { useRef, useState, type DragEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import { ACCEPTED_EXTENSIONS } from '../parsers/parseFile'

interface FileDropzoneProps {
  onFile: (file: File) => void
  disabled?: boolean
}

/** Drag-and-drop area with a fallback file picker for CSV/XLS/XLSX exports. */
export function FileDropzone({ onFile, disabled }: FileDropzoneProps) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  /** Handles a dropped file. */
  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file && !disabled) onFile(file)
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={cn(
        'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 text-center transition-colors',
        dragging ? 'border-primary bg-muted' : 'hover:bg-muted/50',
        disabled && 'pointer-events-none opacity-60',
      )}
    >
      <div className="rounded-full bg-accent p-3 text-accent-foreground">
        <FileUp className="size-6 text-muted-foreground" />
      </div>
      <div>
        <p className="font-medium">{t('import.dropzone')}</p>
        <p className="text-sm text-muted-foreground">{t('import.dropzoneHint')}</p>
      </div>
      <Button type="button" variant="outline" size="sm" tabIndex={-1}>
        {t('import.pickFile')}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS.join(',')}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onFile(file)
          e.target.value = ''
        }}
      />
    </div>
  )
}
