import Papa from 'papaparse'
import type { RawRow } from '@/types'

/** Result of reading a file: the header names and one object per data row. */
export interface ParsedFile {
  headers: string[]
  rows: RawRow[]
}

/** Parses a CSV File with a header row using the given text encoding. */
function parseWithEncoding(file: File, encoding: string): Promise<ParsedFile> {
  return new Promise((resolve, reject) => {
    Papa.parse<RawRow>(file, {
      header: true,
      skipEmptyLines: 'greedy',
      encoding,
      transformHeader: (h) => h.trim(),
      complete: (result) => {
        const headers = (result.meta.fields ?? []).filter((h) => h.length > 0)
        resolve({ headers, rows: result.data })
      },
      error: (err) => reject(err),
    })
  })
}

/** True when decoded text contains replacement characters, i.e. the encoding guess was wrong. */
function looksGarbled(headers: string[]): boolean {
  return headers.some((h) => h.includes('�'))
}

/** Parses a bank CSV export; tries UTF-8 first and falls back to Windows-1255 (common for Israeli banks). */
export async function parseCsv(file: File): Promise<ParsedFile> {
  const utf8 = await parseWithEncoding(file, 'utf-8')
  if (!looksGarbled(utf8.headers)) return utf8
  return parseWithEncoding(file, 'windows-1255')
}
