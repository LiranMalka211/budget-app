import { z } from 'zod'

/** Validation for the scheduled-payment form; messages are i18n keys. */
export const scheduledSchema = z
  .object({
    title: z.string().trim().min(1, 'validation.required'),
    amount: z.coerce.number({ message: 'validation.positiveAmount' }).positive('validation.positiveAmount'),
    typeId: z.string().min(1, 'validation.required'),
    categoryId: z.string().min(1, 'validation.required'),
    interval: z.enum(['weekly', 'monthly', 'yearly']),
    dayOfMonth: z.coerce.number().int().min(1, 'validation.dayOfMonth').max(31, 'validation.dayOfMonth').optional(),
    startDate: z.string().min(1, 'validation.required'),
    endDate: z.string().optional(),
  })
  .refine((v) => !v.endDate || v.endDate > v.startDate, {
    message: 'validation.endAfterStart',
    path: ['endDate'],
  })

/** Raw form values (numbers are strings in inputs). */
export type ScheduledFormValues = z.input<typeof scheduledSchema>
/** Parsed values ready for the API. */
export type ScheduledFormOutput = z.output<typeof scheduledSchema>
