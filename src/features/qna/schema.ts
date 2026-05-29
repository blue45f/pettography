import { speciesCategorySchema } from '@features/species'
import { z } from 'zod'

export const QNA_MAX_TAGS = 5
export const QNA_TITLE_MAX = 120
export const QNA_BODY_MAX = 1000
export const QNA_AUTHOR_MAX = 40

export const qnaAnswerSchema = z.object({
  id: z.string(),
  questionId: z.string(),
  author: z.string().min(1).max(QNA_AUTHOR_MAX),
  body: z.string().min(1).max(QNA_BODY_MAX),
  baseVotes: z.number().int().nonnegative().default(0),
  accepted: z.boolean().default(false),
  createdAt: z.string(),
})

export type QnaAnswer = z.infer<typeof qnaAnswerSchema>

export const qnaQuestionSchema = z.object({
  id: z.string(),
  author: z.string().min(1).max(QNA_AUTHOR_MAX),
  speciesId: z.string().nullable().default(null),
  category: speciesCategorySchema.nullable().default(null),
  title: z.string().min(1).max(QNA_TITLE_MAX),
  body: z.string().min(1).max(QNA_BODY_MAX),
  tags: z.array(z.string()).max(QNA_MAX_TAGS).default([]),
  baseVotes: z.number().int().nonnegative().default(0),
  createdAt: z.string(),
})

export type QnaQuestion = z.infer<typeof qnaQuestionSchema>

export const QNA_SORT_OPTIONS = ['popular', 'unanswered', 'recent'] as const
export type QnaSort = (typeof QNA_SORT_OPTIONS)[number]

export const qnaQuestionFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'qna.errors.titleRequired')
    .max(QNA_TITLE_MAX, 'qna.errors.titleMax'),
  body: z.string().trim().min(1, 'qna.errors.bodyRequired').max(QNA_BODY_MAX, 'qna.errors.bodyMax'),
  author: z
    .string()
    .trim()
    .min(1, 'qna.errors.authorRequired')
    .max(QNA_AUTHOR_MAX, 'qna.errors.authorMax'),
  speciesId: z.string().nullable().default(null),
  tags: z.string().trim().max(200, 'qna.errors.tagsMax').default(''),
})

export type QnaQuestionFormValues = z.infer<typeof qnaQuestionFormSchema>
export type QnaQuestionFormInputValues = z.input<typeof qnaQuestionFormSchema>

export const qnaAnswerFormSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, 'qna.errors.answerRequired')
    .max(QNA_BODY_MAX, 'qna.errors.bodyMax'),
  author: z
    .string()
    .trim()
    .min(1, 'qna.errors.authorRequired')
    .max(QNA_AUTHOR_MAX, 'qna.errors.authorMax'),
})

export type QnaAnswerFormValues = z.infer<typeof qnaAnswerFormSchema>

/** Split a comma-separated tag string into a clean, de-duplicated list. */
export function parseTags(raw: string): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const part of raw.split(',')) {
    const tag = part.trim()
    if (!tag) continue
    const key = tag.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(tag)
    if (out.length >= QNA_MAX_TAGS) break
  }
  return out
}
