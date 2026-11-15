import * as XLSX from 'xlsx'
import { type Cell, extractTable, type ParsedFile } from './extractTable'

/**
 * Parses the first sheet of an Excel export. Bank files often have title rows above the table,
 * so the header row is detected rather than assumed to be the first (see extractTable).
 */
export async function parseXlsx(file: File): Promise<ParsedFile> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: false })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  if (!sheet) return { headers: [], rows: [] }
  const matrix = XLSX.utils.sheet_to_json<Cell[]>(sheet, { header: 1, raw: true, defval: null, blankrows: false })
  return extractTable(matrix)
}
