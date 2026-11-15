import type { ApiContract } from './contract'
import { httpApi } from './httpApi'
import { mockApi } from './mock/mockApi'

/** True when the app should run against the in-browser mock instead of the backend. */
export const USE_MOCK = String(import.meta.env.VITE_USE_MOCK ?? 'true') === 'true'

/** The API used by every feature; swap between mock and HTTP with the VITE_USE_MOCK env flag. */
export const api: ApiContract = USE_MOCK ? mockApi : httpApi

export type { ApiContract } from './contract'
