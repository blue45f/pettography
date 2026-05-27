import { z } from 'zod'

export const expenseCategorySchema = z.enum([
  'feeding',
  'gear',
  'medical',
  'subscription',
  'funeral',
  'other',
])
export type ExpenseCategory = z.infer<typeof expenseCategorySchema>

export const EXPENSE_CATEGORIES: readonly ExpenseCategory[] = [
  'feeding',
  'gear',
  'medical',
  'subscription',
  'funeral',
  'other',
] as const

export const expenseEntrySchema = z.object({
  id: z.string(),
  spentAt: z.string(),
  amountKrw: z.number().int().nonnegative(),
  category: expenseCategorySchema,
  merchant: z.string().max(80).optional(),
  note: z.string().max(200).optional(),
})
export type ExpenseEntry = z.infer<typeof expenseEntrySchema>

export const expenseFormSchema = z.object({
  spentAt: z.string().min(1, 'budget.errors.dateRequired'),
  amountKrw: z
    .number({ message: 'budget.errors.amountNumber' })
    .int()
    .positive('budget.errors.amountPositive'),
  category: expenseCategorySchema,
  merchant: z.string().trim().max(80, 'budget.errors.merchantMax').optional(),
  note: z.string().trim().max(200, 'budget.errors.noteMax').optional(),
})
export type ExpenseFormValues = z.infer<typeof expenseFormSchema>
