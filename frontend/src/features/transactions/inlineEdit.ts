/** The fields that can be changed inline in edit mode. `amount` stays a string while typing. */
export interface RowDraft {
  categoryId: string
  amount: string
  note: string
}

/** True when the typed amount is a positive number (the server rejects anything else). */
export function isValidAmount(amount: string): boolean {
  const n = Number(amount)
  return amount.trim() !== '' && Number.isFinite(n) && n > 0
}
