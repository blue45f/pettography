import { attachmentSchema } from '@features/attachments'
import { speciesCategorySchema } from '@features/species'
import { z } from 'zod'

export const forumPostSchema = z.object({
  id: z.string(),
  category: speciesCategorySchema,
  title: z.string().min(1).max(120),
  author: z.string().min(1).max(40),
  body: z.string().min(1).max(2000),
  createdAt: z.string(),
  likes: z.number().int().nonnegative().default(0),
  views: z.number().int().nonnegative().default(0),
  reportCount: z.number().int().nonnegative().default(0),
  autoHidden: z.boolean().default(false),
  hiddenByAdmin: z.boolean().default(false),
  attachments: z.array(attachmentSchema).max(8).default([]),
})

export const FORUM_AUTO_HIDE_THRESHOLD = 5

export type ForumPost = z.infer<typeof forumPostSchema>

export const FORUM_SORT_OPTIONS = ['hot', 'recent', 'popular', 'views'] as const
export type ForumSort = (typeof FORUM_SORT_OPTIONS)[number]

export interface ForumHotInputs {
  likes: number
  views: number
  replies: number
  createdAt: string
}

export function hotScore(input: ForumHotInputs, nowMs: number = Date.now()): number {
  const ageHours = (nowMs - new Date(input.createdAt).getTime()) / 3_600_000
  const decay = Math.max(0.2, 1 - ageHours / 168)
  return (input.likes * 3 + input.replies * 2 + input.views * 0.1) * decay
}

export const forumReplySchema = z.object({
  id: z.string(),
  postId: z.string(),
  parentReplyId: z.string().nullable().default(null),
  author: z.string().min(1).max(40),
  // Deleted placeholders keep their node in the thread with an empty body.
  body: z.string().max(800),
  createdAt: z.string(),
  reportCount: z.number().int().nonnegative().default(0),
  autoHidden: z.boolean().default(false),
  deleted: z.boolean().default(false),
})

export const FORUM_REPORT_REASONS = [
  'spam',
  'inappropriate',
  'fake',
  'harassment',
  'other',
] as const
export type ForumReportReason = (typeof FORUM_REPORT_REASONS)[number]

export type ForumReply = z.infer<typeof forumReplySchema>

export const FORUM_MAX_REPLY_DEPTH = 4

export interface ForumReplyNode {
  reply: ForumReply
  children: ForumReplyNode[]
}

export function buildReplyTree(replies: readonly ForumReply[]): ForumReplyNode[] {
  const byId = new Map<string, ForumReplyNode>()
  for (const reply of replies) {
    byId.set(reply.id, { reply, children: [] })
  }
  const roots: ForumReplyNode[] = []
  for (const reply of replies) {
    const node = byId.get(reply.id)
    if (!node) continue
    const parent = reply.parentReplyId ? byId.get(reply.parentReplyId) : undefined
    if (parent) parent.children.push(node)
    else roots.push(node)
  }
  const sortNodes = (nodes: ForumReplyNode[]) => {
    nodes.sort((a, b) => a.reply.createdAt.localeCompare(b.reply.createdAt))
    for (const node of nodes) sortNodes(node.children)
  }
  sortNodes(roots)
  return roots
}

/**
 * Removes a reply from a flat thread list while keeping the tree readable:
 * a reply that still has children collapses into a "deleted" placeholder
 * (empty body, node retained) instead of orphaning its descendants. Leaf
 * removals also garbage-collect any placeholder ancestors that became
 * childless, so placeholder chains never linger.
 */
export function removeReplyFromList(list: readonly ForumReply[], replyId: string): ForumReply[] {
  const hasChildren = list.some((r) => r.parentReplyId === replyId)
  let next: ForumReply[]
  if (hasChildren) {
    next = list.map((r) => (r.id === replyId ? { ...r, body: '', deleted: true } : r))
  } else {
    next = list.filter((r) => r.id !== replyId)
  }
  // GC: drop deleted placeholders that no longer shelter any children.
  let changed = true
  while (changed) {
    changed = false
    const parentIds = new Set(next.map((r) => r.parentReplyId).filter(Boolean))
    const pruned = next.filter((r) => !(r.deleted && !parentIds.has(r.id)))
    if (pruned.length !== next.length) {
      next = pruned
      changed = true
    }
  }
  return next
}

export const forumPostFormSchema = z.object({
  category: speciesCategorySchema,
  title: z.string().trim().min(1, 'forum.errors.titleRequired').max(120, 'forum.errors.titleMax'),
  author: z.string().trim().min(1, 'forum.errors.authorRequired').max(40, 'forum.errors.authorMax'),
  body: z.string().trim().min(1, 'forum.errors.bodyRequired').max(2000, 'forum.errors.bodyMax'),
})

export type ForumPostFormValues = z.infer<typeof forumPostFormSchema>

export const forumReplyFormSchema = z.object({
  author: z.string().trim().min(1, 'forum.errors.authorRequired').max(40, 'forum.errors.authorMax'),
  body: z.string().trim().min(1, 'forum.errors.replyRequired').max(800, 'forum.errors.replyMax'),
})

export type ForumReplyFormValues = z.infer<typeof forumReplyFormSchema>
