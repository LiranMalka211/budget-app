import * as XLSX from 'xlsx'
import type { RawRow } from '@/types'
import type { ParsedFile } from './parseCsv'

type Cell = string | number | null | undefined

/** Finds the first row that looks like a header: at least three non-empty text cells. */
function findHeaderRow(matrix: Cell[][]): number {
  for (let i = 0; i < Math.min(matrix.length, 30); i += 1) {
    const textCells = matrix[i].filter((c) => typeof c === 'string' && c.trim().length > 0)
    if (textCells.length >= 3) return i
  }
  return 0
}

/**
 * Parses the first sheet of an Excel export. Bank files often have title rows above the table,
 * so the header row is detected rather than assumed to be the first.
 */
export async function parseXlsx(file: File): Promise<ParsedFile> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: false })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  if (!sheet) return { headers: [], rows: [] }
  const matrix = XLSX.utils.sheet_to_json<Cell[]>(sheet, { header: 1, raw: true, defval: null })
  if (matrix.length === 0) return { headers: [], rows: [] }

  const headerIndex = findHeaderRow(matrix)
  const headers = matrix[headerIndex].map((h, i) => (h === null || h === undefined || h === '' ? `col_${i + 1}` : String(h).trim()))
  const rows: RawRow[] = []
  for (const line of matrix.slice(headerIndex + 1)) {
    if (!line || line.every((c) => c === null || c === undefined || c === '')) continue
    const row: RawRow = {}
    headers.forEach((h, i) => {
      const v = line[i]
      row[h] = v === undefined ? null : v
    })
    rows.push(row)
  }
  return { headers, rows }
}
