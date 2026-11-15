/** Generates a random unique id for client-created records (mock mode and preview rows). */
export function newId(prefix = ''): string {
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36)
  return prefix ? `${prefix}_${id}` : id
}

/** Generates a short, human-friendly family invite key such as "K7PQ-3MZD". */
export function newInviteKey(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const pick = () => alphabet[Math.floor(Math.random() * alphabet.length)]
  const block = () => Array.from({ length: 4 }, pick).join('')
  return `${block()}-${block()}`
}
