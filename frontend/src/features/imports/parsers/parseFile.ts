import { parseCsv, type ParsedFile } from './parseCsv'
import { decodeText, looksLikeHtml, parseHtmlTable } from './parseHtmlTable'
import { parseXlsx } from './parseXlsx'

/** File extensions the import flow accepts. */
export const ACCEPTED_EXTENSIONS = ['.csv', '.xls', '.xlsx']

/** Maximum upload size (5 MB). */
export const MAX_FILE_SIZE = 5 * 1024 * 1024

/** Picks the right parser from the file extension and returns headers plus rows. */
export async function parseFile(file: File): Promise<ParsedFile> {
  const name = file.name.toLowerCase()
  if (name.endsWith('.csv')) return parseCsv(file)
  if (name.endsWith('.xls') || name.endsWith('.xlsx')) {
    // Many Israeli banks export an HTML page saved as .xls; read its table directly instead of via the Excel parser.
    const bytes = new Uint8Array(await file.arrayBuffer())
    const isZipOrOle = (bytes[0] === 0x50 && bytes[1] === 0x4b) || (bytes[0] === 0xd0 && bytes[1] === 0xcf)
    if (!isZipOrOle) {
      const text = decodeText(bytes)
      if (looksLikeHtml(text)) return parseHtmlTable(text)
    }
    return parseXlsx(file)
  }
  throw new Error('unsupported')
}
