import { parseCsv, type ParsedFile } from './parseCsv'
import { parseXlsx } from './parseXlsx'

/** File extensions the import flow accepts. */
export const ACCEPTED_EXTENSIONS = ['.csv', '.xls', '.xlsx']

/** Maximum upload size (5 MB). */
export const MAX_FILE_SIZE = 5 * 1024 * 1024

/** Picks the right parser from the file extension and returns headers plus rows. */
export async function parseFile(file: File): Promise<ParsedFile> {
  const name = file.name.toLowerCase()
  if (name.endsWith('.csv')) return parseCsv(file)
  if (name.endsWith('.xls') || name.endsWith('.xlsx')) return parseXlsx(file)
  throw new Error('unsupported')
}
