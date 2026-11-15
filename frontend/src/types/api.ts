/** Error thrown by the API layer so UI code can show a message and react to status codes. */
export class ApiError extends Error {
  status: number
  /** Optional machine-readable code (e.g. "invalid_credentials") used as an i18n key. */
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}
