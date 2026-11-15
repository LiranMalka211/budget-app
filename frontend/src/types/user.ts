/** A registered user. Mirrors the `users` table (password is never sent to the client). */
export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  /** Family the user belongs to, or null when they manage a personal budget only. */
  familyId: string | null
}

/** Payload for the registration form. */
export interface RegisterInput {
  firstName: string
  lastName: string
  email: string
  password: string
}

/** Payload for the login form. */
export interface LoginInput {
  email: string
  password: string
}

/** Response returned after a successful login or registration. */
export interface AuthResponse {
  token: string
  user: User
}

/** Editable profile fields. */
export interface UpdateProfileInput {
  firstName: string
  lastName: string
}
