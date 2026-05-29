import { z } from 'zod'

export const SHOWCASE_THEME_IDS = [
  'freestyle',
  'postShed',
  'enclosureFull',
  'feedingReaction',
  'baby',
] as const

export const showcaseThemeSchema = z.enum(SHOWCASE_THEME_IDS)

export type ShowcaseThemeId = z.infer<typeof showcaseThemeSchema>

export const showcasePostSchema = z.object({
  id: z.string(),
  author: z.string().min(1).max(40),
  petId: z.string().nullable().optional().default(null),
  speciesId: z.string().nullable(),
  imageUrl: z.string().url(),
  caption: z.string().max(200),
  themeId: showcaseThemeSchema,
  baseVotes: z.number().int().nonnegative(),
  createdAt: z.string(),
})

export type ShowcasePost = z.infer<typeof showcasePostSchema>

export const SHOWCASE_SORT_OPTIONS = ['popular', 'recent'] as const
export type ShowcaseSort = (typeof SHOWCASE_SORT_OPTIONS)[number]

export const showcaseFormSchema = z.object({
  author: z
    .string()
    .trim()
    .min(1, 'showcase.errors.authorRequired')
    .max(40, 'showcase.errors.authorMax'),
  imageUrl: z
    .string()
    .trim()
    .min(1, 'showcase.errors.imageRequired')
    .url('showcase.errors.imageUrl'),
  caption: z.string().trim().max(200, 'showcase.errors.captionMax'),
  themeId: showcaseThemeSchema,
})

export type ShowcaseFormValues = z.infer<typeof showcaseFormSchema>

/** Effective vote count = stored base votes + 1 if the current user has voted. */
export function voteCount(post: ShowcasePost, votedIds: Record<string, true>): number {
  return post.baseVotes + (votedIds[post.id] ? 1 : 0)
}

/** Highest-voted post for a given theme, or null when none exist for it. */
export function topPostForTheme(
  posts: readonly ShowcasePost[],
  votedIds: Record<string, true>,
  themeId: ShowcaseThemeId,
): ShowcasePost | null {
  let best: ShowcasePost | null = null
  let bestVotes = -1
  for (const post of posts) {
    if (post.themeId !== themeId) continue
    const votes = voteCount(post, votedIds)
    if (votes > bestVotes) {
      best = post
      bestVotes = votes
    }
  }
  return best
}
