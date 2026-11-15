import { z } from 'zod'

/** Reusable email rule; messages are i18n keys translated by the form. */
const email = z.string().trim().min(1, 'validation.required').email('validation.email')

/** Reusable password rule (minimum 8 characters). */
const password = z.string().min(8, 'validation.minLength')

/** Validation for the login form. */
export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'validation.required'),
})
export type LoginFormValues = z.infer<typeof loginSchema>

/** Validation for the registration form, including password confirmation. */
export const registerSchema = z
  .object({
    firstName: z.string().trim().min(1, 'validation.required'),
    lastName: z.string().trim().min(1, 'validation.required'),
    email,
    password,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: 'validation.passwordsMismatch',
    path: ['confirmPassword'],
  })
export type RegisterFormValues = z.infer<typeof registerSchema>

/** Validation for the forgot-password form. */
export const forgotPasswordSchema = z.object({ email })
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

/** Validation for the reset-password form. */
export const resetPasswordSchema = z
  .object({ password, confirmPassword: z.string() })
  .refine((v) => v.password === v.confirmPassword, {
    message: 'validation.passwordsMismatch',
    path: ['confirmPassword'],
  })
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>

/** Validation for the profile form in settings. */
export const profileSchema = z.object({
  firstName: z.string().trim().min(1, 'validation.required'),
  lastName: z.string().trim().min(1, 'validation.required'),
})
export type ProfileFormValues = z.infer<typeof profileSchema>
