import { z } from 'zod'

export const galleryPhotoSchema = z.object({
  id: z.string(),
  speciesId: z.string(),
  imageUrl: z.string().url(),
  sourceUrl: z.string().url().optional(),
  caption: z.string().max(120).optional(),
  addedAt: z.string(),
})

export type GalleryPhoto = z.infer<typeof galleryPhotoSchema>

export const photoInputSchema = z.object({
  imageUrl: z.string().url(),
  sourceUrl: z.string().url().optional().or(z.literal('')),
  caption: z.string().max(120).optional(),
})

export type PhotoInput = z.infer<typeof photoInputSchema>
