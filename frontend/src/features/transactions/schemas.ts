import { z } from 'zod'

/** Validation for the add/edit transaction form; messages are i18n keys. */
export const transactionSchema = z.object({
  date: z.string().min(1, 'validation.required'),
  title: z.string().trim().min(1, 'validation.required'),
  amount: z.coerce.number({ message: 'validation.positiveAmount' }).positive('validation.positiveAmount'),
  typeId: z.string().min(1, 'validation.required'),
  categoryId: z.string().min(1, 'validation.required'),
  note: z.string().trim().optional(),
})

/** Form values before coercion (amount is typed as a string in the input). */
export type TransactionFormValues = z.input<typeof transactionSchema>
/** Parsed, validated values sent to the API. */
export type TransactionFormOutput = z.output<typeof transactionSchema>
