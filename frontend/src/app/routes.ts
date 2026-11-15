/** Central list of route paths so links and the router never drift apart. */
export const ROUTES = {
  dashboard: '/',
  transactions: '/transactions',
  scheduled: '/scheduled',
  family: '/family',
  import: '/import',
  insights: '/insights',
  settings: '/settings',
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password/:token',
} as const

/** Builds the reset-password URL for a given token. */
export function resetPasswordPath(token: string): string {
  return `/reset-password/${encodeURIComponent(token)}`
}
