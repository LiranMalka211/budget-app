import { type Cell, extractTable, headerScore, type ParsedFile } from './extractTable'

/**
 * Decodes file bytes to text. Honours UTF-8/UTF-16 byte-order marks; otherwise tries UTF-8 and
 * falls back to the page's declared charset or Windows-1255 (Hebrew) when UTF-8 produces garbage.
 */
export function decodeText(bytes: Uint8Array): string {
  if (bytes[0] === 0xff && bytes[1] === 0xfe) return new TextDecoder('utf-16le').decode(bytes)
  if (bytes[0] === 0xfe && bytes[1] === 0xff) return new TextDecoder('utf-16be').decode(bytes)
  const utf8 = new TextDecoder('utf-8').decode(bytes)
  if (!utf8.includes('�')) return utf8
  const declared = /charset\s*=\s*["']?([\w-]+)/i.exec(utf8)?.[1]
  for (const label of [declared, 'windows-1255']) {
    if (!label) continue
    try {
      return new TextDecoder(label).decode(bytes)
    } catch {
      // Unknown label: try the next one.
    }
  }
  return utf8
}

/** True when the text is an HTML page with a table, which many banks save with an .xls extension. */
export function looksLikeHtml(text: string): boolean {
  const head = text.replace(/^﻿/, '').trimStart().slice(0, 2048).toLowerCase()
  return head.startsWith('<') && /<(html|table|!doctype html)/.test(head) && text.toLowerCase().includes('<table')
}

/** Visible text of a cell, with non-breaking spaces and runs of whitespace collapsed. */
function cellText(cell: Element): string {
  return (cell.textContent ?? '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim()
}

/**
 * Turns one <table> into a grid; colspan cells are padded so columns stay aligned with the header.
 * Only the table's own rows are read; rows of tables nested inside it belong to those tables.
 */
function tableToMatrix(table: Element): Cell[][] {
  const ownRows = Array.from(table.querySelectorAll('tr')).filter((tr) => tr.closest('table') === table)
  return ownRows.map((tr) => {
    const line: Cell[] = []
    for (const cell of Array.from(tr.children)) {
      const tag = cell.tagName.toLowerCase()
      if (tag !== 'td' && tag !== 'th') continue
      line.push(cellText(cell))
      const span = Number(cell.getAttribute('colspan')) || 1
      for (let i = 1; i < span; i += 1) line.push(null)
    }
    return line
  })
}

/**
 * Parses an HTML "Excel" export. Pages often contain several tables (titles, account details,
 * layout), so the one whose header row best matches known column names is used.
 */
export function parseHtmlTable(html: string): ParsedFile {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  let best: Cell[][] | null = null
  let bestScore = -1
  for (const table of Array.from(doc.querySelectorAll('table'))) {
    const matrix = tableToMatrix(table)
    const score = headerScore(matrix) * 10_000 + matrix.length
    if (score > bestScore) {
      best = matrix
      bestScore = score
    }
  }
  return best ? extractTable(best) : { headers: [], rows: [] }
}
