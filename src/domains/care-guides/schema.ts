import { z } from 'zod'

export const careGuideSectionSchema = z.object({
  title: z.string(),
  body: z.string(),
})

export const careGuideReferenceSchema = z.object({
  label: z.string(),
  url: z.string().url(),
})

export const careGuideSchema = z.object({
  id: z.string(),
  speciesId: z.string(),
  sections: z.array(careGuideSectionSchema).min(1),
  references: z.array(careGuideReferenceSchema),
})

export type CareGuideSection = z.infer<typeof careGuideSectionSchema>
export type CareGuideReference = z.infer<typeof careGuideReferenceSchema>
export type CareGuide = z.infer<typeof careGuideSchema>
