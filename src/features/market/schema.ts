import { speciesCategorySchema } from '@features/species'
import { z } from 'zod'

export const regionSchema = z.enum(['songpa', 'gangnam', 'jamsil', 'online', 'other'])
export type MarketRegion = z.infer<typeof regionSchema>

export const MARKET_REGIONS: readonly MarketRegion[] = [
  'songpa',
  'gangnam',
  'jamsil',
  'online',
  'other',
] as const

export const cbStatusSchema = z.enum(['cb', 'wc', 'unknown'])
export type CbStatus = z.infer<typeof cbStatusSchema>

export const CB_STATUSES: readonly CbStatus[] = ['cb', 'wc', 'unknown'] as const

export const listingSchema = z.object({
  id: z.string(),
  author: z.string().min(1).max(40),
  speciesId: z.string().nullable(),
  category: speciesCategorySchema.nullable(),
  title: z.string().min(1).max(80),
  morph: z.string().max(60),
  isFree: z.boolean(),
  priceKrw: z.number().int().nonnegative().nullable(),
  region: regionSchema,
  cbStatus: cbStatusSchema,
  contact: z.string().min(1).max(120),
  description: z.string().min(1).max(600),
  createdAt: z.string(),
})

export type Listing = z.infer<typeof listingSchema>

export const MARKET_SORT_OPTIONS = ['recent', 'priceAsc'] as const
export type MarketSort = (typeof MARKET_SORT_OPTIONS)[number]

export const listingFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'market.errors.titleRequired')
      .max(80, 'market.errors.titleMax'),
    speciesId: z.string().nullable(),
    morph: z.string().trim().max(60, 'market.errors.morphMax'),
    region: regionSchema,
    cbStatus: cbStatusSchema,
    isFree: z.boolean(),
    priceKrw: z
      .number()
      .int('market.errors.priceInvalid')
      .nonnegative('market.errors.priceInvalid')
      .nullable(),
    contact: z
      .string()
      .trim()
      .min(1, 'market.errors.contactRequired')
      .max(120, 'market.errors.contactMax'),
    description: z
      .string()
      .trim()
      .min(1, 'market.errors.descriptionRequired')
      .max(600, 'market.errors.descriptionMax'),
    author: z
      .string()
      .trim()
      .min(1, 'market.errors.authorRequired')
      .max(40, 'market.errors.authorMax'),
  })
  .superRefine((value, ctx) => {
    if (value.isFree) return
    if (value.priceKrw == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'market.errors.priceRequired',
        path: ['priceKrw'],
      })
    }
  })

export type ListingFormValues = z.infer<typeof listingFormSchema>

/** Sort key that always pushes free listings together at the bottom of price-asc ordering. */
export function priceSortKey(listing: Pick<Listing, 'isFree' | 'priceKrw'>): number {
  if (listing.isFree || listing.priceKrw == null) return Number.POSITIVE_INFINITY
  return listing.priceKrw
}
