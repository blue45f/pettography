import { z } from 'zod'

export const diaryCategorySchema = z.enum(['feeding', 'weight', 'shed', 'vet', 'behavior', 'note'])
export type DiaryCategory = z.infer<typeof diaryCategorySchema>

export const DIARY_CATEGORIES: readonly DiaryCategory[] = [
  'feeding',
  'weight',
  'shed',
  'vet',
  'behavior',
  'note',
] as const

export const diaryEntrySchema = z.object({
  id: z.string(),
  speciesId: z.string().nullable(),
  category: diaryCategorySchema,
  occurredAt: z.string(),
  body: z.string().max(500),
  weightGram: z.number().nullable(),
  createdAt: z.string(),
})

export type DiaryEntry = z.infer<typeof diaryEntrySchema>

export const diaryFormSchema = z.object({
  category: diaryCategorySchema,
  occurredAt: z.string().min(1, 'diary.errors.dateRequired'),
  body: z.string().trim().min(1, 'diary.errors.bodyRequired').max(500, 'diary.errors.bodyMax'),
  weightGram: z
    .number({ message: 'diary.errors.weightNumber' })
    .int()
    .positive('diary.errors.weightPositive')
    .nullable()
    .optional(),
})

export type DiaryFormValues = z.infer<typeof diaryFormSchema>
