import { z } from 'zod'

const httpUrlSchema = z
  .string()
  .trim()
  .max(2048)
  .url()
  .refine((value) => /^https?:\/\//i.test(value))

export const galleryPhotoSchema = z.object({
  id: z.string(),
  petId: z.string().nullable().optional(),
  speciesId: z.string(),
  imageUrl: httpUrlSchema,
  sourceUrl: httpUrlSchema.optional(),
  caption: z.string().max(120).optional(),
  addedAt: z.string(),
})

export type GalleryPhoto = z.infer<typeof galleryPhotoSchema>

export const photoInputSchema = z.object({
  imageUrl: httpUrlSchema,
  sourceUrl: httpUrlSchema.optional().or(z.literal('')),
  caption: z.string().trim().max(120).optional(),
})

export type PhotoInput = z.infer<typeof photoInputSchema>
