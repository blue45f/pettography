import { attachmentSchema } from '@domains/attachments'
import { speciesCategorySchema } from '@domains/species'
import { z } from 'zod'

/**
 * 종별 카페 — species-scoped clubs that live entirely in this browser
 * (no auth, no server), promoted from the external-links Communities page.
 * Split routes: /cafes (directory) · /cafes/new (creation) · /cafes/:cafeId
 * (board). Each route does exactly one job.
 */
export const cafeSchema = z.object({
  id: z.string(),
  name: z.string().min(2).max(60),
  description: z.string().min(10).max(500),
  /** Species this club is about (catalog id, e.g. sp-leopard-gecko). */
  speciesId: z.string().min(1),
  /** Denormalised display name so the directory renders without a species fetch. */
  speciesName: z.string().min(1).max(80),
  category: speciesCategorySchema,
  emoji: z.string().min(1).max(8),
  createdBy: z.string().min(1).max(40),
  createdAt: z.string(),
  /** Seeded membership baseline; the local member adds +1 when joined. */
  baseMemberCount: z.number().int().nonnegative().default(0),
  archivedByAdmin: z.boolean().default(false),
})

export type Cafe = z.infer<typeof cafeSchema>

export const cafePostSchema = z.object({
  id: z.string(),
  cafeId: z.string(),
  title: z.string().min(1).max(120),
  author: z.string().min(1).max(40),
  body: z.string().min(1).max(2000),
  createdAt: z.string(),
  hiddenByAdmin: z.boolean().default(false),
  attachments: z.array(attachmentSchema).max(8).default([]),
})

export type CafePost = z.infer<typeof cafePostSchema>

export const cafeCommentSchema = z.object({
  id: z.string(),
  postId: z.string(),
  /** Single-level threading: a comment either is a root or answers a root. */
  parentCommentId: z.string().nullable().default(null),
  author: z.string().min(1).max(40),
  body: z.string().max(600),
  createdAt: z.string(),
  deleted: z.boolean().default(false),
})

export type CafeComment = z.infer<typeof cafeCommentSchema>

export interface CafeCommentThread {
  comment: CafeComment
  children: CafeComment[]
}

/**
 * Builds single-level threads. Replies pointing at another reply are folded
 * up to that reply's root, so the depth never exceeds one even when older
 * data carries deeper chains.
 */
export function buildCommentThreads(comments: readonly CafeComment[]): CafeCommentThread[] {
  const byId = new Map(comments.map((c) => [c.id, c]))
  const resolveRootId = (comment: CafeComment): string => {
    let current = comment
    const seen = new Set<string>([current.id])
    while (current.parentCommentId) {
      const parent = byId.get(current.parentCommentId)
      if (!parent || seen.has(parent.id)) break
      seen.add(parent.id)
      current = parent
    }
    return current.id
  }

  const threads = new Map<string, CafeCommentThread>()
  const ordered = [...comments].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  for (const comment of ordered) {
    if (!comment.parentCommentId) {
      threads.set(comment.id, { comment, children: [] })
    }
  }
  for (const comment of ordered) {
    if (!comment.parentCommentId) continue
    const rootId = resolveRootId(comment)
    const thread = threads.get(rootId)
    if (thread && rootId !== comment.id) {
      thread.children.push(comment)
    } else {
      // Orphaned reply (root hard-removed): promote to its own thread.
      threads.set(comment.id, { comment, children: [] })
    }
  }
  return [...threads.values()].sort((a, b) =>
    a.comment.createdAt.localeCompare(b.comment.createdAt),
  )
}

/**
 * Removes a comment; roots that still have answers become deleted
 * placeholders so the thread stays readable, and placeholders disappear once
 * their last answer is gone.
 */
export function removeCommentFromList(
  list: readonly CafeComment[],
  commentId: string,
): CafeComment[] {
  const hasChildren = list.some((c) => c.parentCommentId === commentId)
  let next: CafeComment[]
  if (hasChildren) {
    next = list.map((c) => (c.id === commentId ? { ...c, body: '', deleted: true } : c))
  } else {
    next = list.filter((c) => c.id !== commentId)
  }
  const parentIds = new Set(next.map((c) => c.parentCommentId).filter(Boolean))
  return next.filter((c) => !(c.deleted && !parentIds.has(c.id)))
}

export const cafeFormSchema = z.object({
  name: z.string().trim().min(2, 'cafes.errors.nameMin').max(60, 'cafes.errors.nameMax'),
  description: z
    .string()
    .trim()
    .min(10, 'cafes.errors.descriptionMin')
    .max(500, 'cafes.errors.descriptionMax'),
  speciesId: z.string().min(1, 'cafes.errors.speciesRequired'),
  createdBy: z
    .string()
    .trim()
    .min(1, 'cafes.errors.nicknameRequired')
    .max(40, 'cafes.errors.nicknameMax'),
  emoji: z.string().min(1).max(8),
})

export type CafeFormValues = z.infer<typeof cafeFormSchema>

export const cafePostFormSchema = z.object({
  title: z.string().trim().min(1, 'cafes.errors.titleRequired').max(120, 'cafes.errors.titleMax'),
  author: z
    .string()
    .trim()
    .min(1, 'cafes.errors.nicknameRequired')
    .max(40, 'cafes.errors.nicknameMax'),
  body: z.string().trim().min(1, 'cafes.errors.bodyRequired').max(2000, 'cafes.errors.bodyMax'),
})

export type CafePostFormValues = z.infer<typeof cafePostFormSchema>

export const cafeCommentFormSchema = z.object({
  author: z
    .string()
    .trim()
    .min(1, 'cafes.errors.nicknameRequired')
    .max(40, 'cafes.errors.nicknameMax'),
  body: z
    .string()
    .trim()
    .min(1, 'cafes.errors.commentRequired')
    .max(600, 'cafes.errors.commentMax'),
})

export type CafeCommentFormValues = z.infer<typeof cafeCommentFormSchema>

export const CAFE_EMOJI_CHOICES = ['🦎', '🦜', '🕷️', '🐢', '🐍', '🐹', '🐸', '🐾'] as const
