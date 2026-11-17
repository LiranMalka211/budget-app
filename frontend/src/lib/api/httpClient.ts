import { ApiError } from '@/types'

/** localStorage key that holds the JWT. Shared with the auth store. */
export const TOKEN_STORAGE_KEY = 'budget.token'

/** Reads the saved auth token, if any. */
export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY)
  } catch {
    return null
  }
}

/** Saves or clears the auth token. */
export function setToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token)
    else localStorage.removeItem(TOKEN_STORAGE_KEY)
  } catch {
    /* storage unavailable */
  }
}

/**
 * Base URL of the backend, from .env. VITE_API_HOST (a bare host such as "budget-api.onrender.com", which is what
 * Render hands a blueprint) wins over VITE_API_URL and becomes "https://<host>/api".
 */
const API_HOST = (import.meta.env.VITE_API_HOST as string | undefined)?.trim()
const BASE_URL = API_HOST
  ? `https://${API_HOST.replace(/^https?:\/\//, '').replace(/\/+$/, '')}/api`
  : ((import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8000/api')

/** Builds a query string from an object, skipping empty values. */
export function toQuery(params: Record<string, string | number | undefined | null>): string {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') q.set(k, String(v))
  }
  const s = q.toString()
  return s ? `?${s}` : ''
}

/** Performs a JSON request against the backend, attaching the bearer token and mapping errors to ApiError. */
export async function request<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError('Network error', 0, 'network')
  }

  if (!res.ok) {
    let message = res.statusText
    let code: string | undefined
    try {
      const data = (await res.json()) as { detail?: string; message?: string; code?: string }
      message = data.message ?? data.detail ?? message
      code = data.code
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(message, res.status, code)
  }

  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}
