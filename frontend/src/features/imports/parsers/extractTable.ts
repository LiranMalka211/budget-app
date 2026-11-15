import type { RawRow } from '@/types'
import { HEADER_KEYWORDS } from './bankPresets'

/** One cell as read from a CSV or Excel sheet. */
export type Cell = string | number | boolean | Date | null | undefined

/** Result of reading a file: the header names and one object per data row. */
export interface ParsedFile {
  headers: string[]
  rows: RawRow[]
}

/** How many leading rows are searched for the header row (bank exports put titles/account info above the table). */
const HEADER_SEARCH_ROWS = 30

const ALL_KEYWORDS = Object.values(HEADER_KEYWORDS).flat()

const isEmpty = (c: Cell) => c === null || c === undefined || (typeof c === 'string' && c.trim() === '')

/** A text cell that is not just a number or a date, i.e. something that could be a column title. */
const isLabel = (c: Cell) => typeof c === 'string' && c.trim() !== '' && !/^[\d\s.,/:\-₪$%()]+$/.test(c.trim())

/** Longest text treated as a column title; longer cells are titles, notes or whole layout blocks. */
const MAX_HEADER_LENGTH = 40

/** True when a cell's text matches one of the known column names (English or Hebrew). */
const matchesKeyword = (c: Cell) => {
  if (!isLabel(c)) return false
  const text = String(c).trim().toLowerCase()
  if (text.length > MAX_HEADER_LENGTH) return false
  return ALL_KEYWORDS.some((kw) => text === kw || text.includes(kw))
}

/**
 * Picks the header row: the row with the most cells matching known column names, then the most label cells.
 * A row only qualifies if at least two of its cells are labels and a non-empty row follows it.
 */
function findHeaderRow(matrix: Cell[][]): number {
  let best = -1
  let bestScore = -1
  const limit = Math.min(matrix.length - 1, HEADER_SEARCH_ROWS)
  for (let i = 0; i < limit; i += 1) {
    const row = matrix[i] ?? []
    const labels = row.filter(isLabel).length
    if (labels < 2) continue
    const next = matrix[i + 1] ?? []
    if (next.filter((c) => !isEmpty(c)).length < 2) continue
    const score = row.filter(matchesKeyword).length * 100 + labels
    if (score > bestScore) {
      best = i
      bestScore = score
    }
  }
  return best >= 0 ? best : 0
}

/** How well a grid's best header row matches known column names; used to choose between tables in one file. */
export function headerScore(matrix: Cell[][]): number {
  const rows = matrix.slice(0, HEADER_SEARCH_ROWS)
  return rows.reduce((best, row) => Math.max(best, (row ?? []).filter(matchesKeyword).length), 0)
}

/** Converts a 2D grid of cells into headers + row objects, skipping title rows, empty rows and empty columns. */
export function extractTable(matrix: Cell[][]): ParsedFile {
  if (matrix.length === 0) return { headers: [], rows: [] }

  const headerIndex = findHeaderRow(matrix)
  const body = matrix.slice(headerIndex + 1).filter((line) => line && !line.every(isEmpty))
  const width = Math.max(matrix[headerIndex].length, ...body.map((line) => line.length))

  const headers: string[] = []
  const columns: number[] = []
  const seen = new Map<string, number>()
  for (let col = 0; col < width; col += 1) {
    const raw = matrix[headerIndex][col]
    const hasData = body.some((line) => !isEmpty(line[col]))
    if (isEmpty(raw) && !hasData) continue // spacer column
    let name = isEmpty(raw) ? `col_${col + 1}` : String(raw).replace(/\s+/g, ' ').trim()
    // Two columns with the same title (e.g. two "תאריך" columns) must both stay selectable.
    const count = (seen.get(name) ?? 0) + 1
    seen.set(name, count)
    if (count > 1) name = `${name} (${count})`
    headers.push(name)
    columns.push(col)
  }

  const rows: RawRow[] = body.map((line) => {
    const row: RawRow = {}
    headers.forEach((h, i) => {
      const v = line[columns[i]]
      row[h] = v === undefined || v === null ? null : v instanceof Date ? v.toISOString() : typeof v === 'boolean' ? String(v) : v
    })
    return row
  })
  return { headers, rows }
}
