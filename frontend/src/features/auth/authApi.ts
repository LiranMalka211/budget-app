import { api } from '@/lib/api'
import type { LoginInput, RegisterInput, UpdateProfileInput } from '@/types'

/** Typed wrappers around the auth endpoints so components never import the API object directly. */
export const authApi = {
  /** Creates an account and returns a session token. */
  register: (input: RegisterInput) => api.auth.register(input),
  /** Exchanges credentials for a session token. */
  login: (input: LoginInput) => api.auth.login(input),
  /** Loads the user that owns the current token. */
  me: () => api.auth.me(),
  /** Updates first and last name. */
  updateProfile: (input: UpdateProfileInput) => api.auth.updateProfile(input),
  /** Requests a password reset email. */
  forgotPassword: (email: string) => api.auth.forgotPassword(email),
  /** Sets a new password using a reset token. */
  resetPassword: (token: string, password: string) => api.auth.resetPassword(token, password),
}
