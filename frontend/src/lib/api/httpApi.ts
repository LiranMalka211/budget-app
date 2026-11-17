import type { ApiContract } from './contract'
import { request, toQuery } from './httpClient'

/** ApiContract implementation that talks to the Python backend over HTTP/JSON. */
export const httpApi: ApiContract = {
  auth: {
    register: (input) => request('POST', '/auth/register', input),
    login: (input) => request('POST', '/auth/login', input),
    me: () => request('GET', '/auth/me'),
    updateProfile: (input) => request('PUT', '/auth/me', input),
    forgotPassword: (email) => request('POST', '/auth/forgot-password', { email }),
    resetPassword: (token, password) => request('POST', '/auth/reset-password', { token, password }),
  },
  family: {
    getMine: () => request('GET', '/families/me'),
    create: (name) => request('POST', '/families', { name }),
    join: (inviteKey) => request('POST', '/families/join', { inviteKey }),
    approveMember: (userId) => request('POST', `/families/members/${userId}/approve`),
    removeMember: (userId) => request('DELETE', `/families/members/${userId}`),
    setMemberPermission: (userId, canEdit) => request('PUT', `/families/members/${userId}/permissions`, { canEdit }),
    leave: () => request('POST', '/families/leave'),
    regenerateKey: () => request('POST', '/families/regenerate-key'),
  },
  lookups: {
    transactionTypes: () => request('GET', '/transaction-types'),
    categories: () => request('GET', '/categories'),
    createCategory: (input) => request('POST', '/categories', input),
  },
  transactions: {
    list: (filters) => request('GET', `/transactions${toQuery({ ...filters })}`),
    create: (input) => request('POST', '/transactions', input),
    update: (id, input) => request('PUT', `/transactions/${id}`, input),
    remove: (id) => request('DELETE', `/transactions/${id}`),
  },
  scheduled: {
    list: () => request('GET', '/scheduled-transactions'),
    create: (input) => request('POST', '/scheduled-transactions', input),
    update: (id, input) => request('PUT', `/scheduled-transactions/${id}`, input),
    remove: (id) => request('DELETE', `/scheduled-transactions/${id}`),
    toggle: (id, isActive) => request('POST', `/scheduled-transactions/${id}/toggle`, { isActive }),
  },
  imports: {
    commit: (input) => request('POST', '/imports', input),
  },
  insights: {
    list: () => request('GET', '/insights'),
    generate: () => request('POST', '/insights/generate'),
  },
  dashboard: {
    summary: (from, to) => request('GET', `/dashboard/summary${toQuery({ from, to })}`),
  },
}
