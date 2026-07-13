import { z } from 'zod'

const ISO_DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function localTodayIso(): string {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10)
}

/** How keen the keeper is — drives sort order and the priority badge. */
export const prioritySchema = z.enum(['someday', 'soon', 'next'])
export type Priority = z.infer<typeof prioritySchema>

export const PRIORITIES: readonly Priority[] = ['someday', 'soon', 'next'] as const

/**
 * A keeper-level wish for a future species. Intentionally NOT pet-scoped: the
 * wishlist describes animals the keeper does not own yet, so there is no
 * `petId`. `readiness` maps a readiness item id (see `READINESS_ITEMS`) to its
 * checked state; missing ids are treated as unchecked.
 */
export const wishlistItemSchema = z.object({
  id: z.string(),
  speciesId: z.string(),
  priority: prioritySchema,
  targetDate: z.string().nullable(),
  notes: z.string().max(300),
  readiness: z.record(z.string(), z.boolean()),
  createdAt: z.string(),
})

export type WishlistItem = z.infer<typeof wishlistItemSchema>

/**
 * Add-to-wishlist form. Fields are required with RHF defaults supplied at the
 * call site to avoid `zodResolver` friction; `targetDate` accepts an empty
 * string (the page normalises it to `null` before persisting).
 */
export const wishlistFormSchema = z.object({
  speciesId: z.string().min(1, 'wishlist.errors.speciesRequired'),
  priority: prioritySchema,
  targetDate: z
    .string()
    .refine((value) => value === '' || ISO_DAY_PATTERN.test(value), 'wishlist.errors.dateInvalid')
    .refine((value) => value === '' || value >= localTodayIso(), 'wishlist.errors.datePast'),
  notes: z.string().trim().max(300, 'wishlist.errors.notesMax'),
})

export type WishlistFormValues = z.infer<typeof wishlistFormSchema>
