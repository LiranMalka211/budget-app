import Papa from 'papaparse'
import { extractTable, type ParsedFile } from './extractTable'

export type { ParsedFile } from './extractTable'

/** Reads a CSV File into a grid of cells using the given text encoding. */
function readMatrix(file: File, encoding: string): Promise<string[][]> {
  return new Promise((resolve, reject) => {
    Papa.parse<string[]>(file, {
      header: false,
      skipEmptyLines: 'greedy',
      encoding,
      complete: (result) => resolve(result.data),
      error: (err) => reject(err),
    })
  })
}

/** True when decoded text contains replacement characters, i.e. the encoding guess was wrong. */
function looksGarbled(matrix: string[][]): boolean {
  return matrix.slice(0, 40).some((line) => line.some((c) => c.includes('�')))
}

/**
 * Parses a bank CSV export; tries UTF-8 first and falls back to Windows-1255 (common for Israeli banks).
 * Like Excel files, the header row is detected so title lines above the table are skipped.
 */
export async function parseCsv(file: File): Promise<ParsedFile> {
  let matrix = await readMatrix(file, 'utf-8')
  if (looksGarbled(matrix)) matrix = await readMatrix(file, 'windows-1255')
  return extractTable(matrix)
}
