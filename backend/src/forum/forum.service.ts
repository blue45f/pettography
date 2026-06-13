import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { FORUM_POSTS_SEED, FORUM_REPLIES_SEED } from '../data/forum.seed';
import type { ForumPost, ForumReply, PublicAccount } from '../common/types';
import { ModerationService } from '../moderation/moderation.service';
import type { QueryForumDto } from './dto/query-forum.dto';
import type { CreatePostDto } from './dto/create-post.dto';
import type { CreateReplyDto } from './dto/create-reply.dto';
import type { UpdateForumModerationDto } from './dto/update-forum-moderation.dto';

@Injectable()
export class ForumService {
  constructor(private readonly moderationService: ModerationService) {}

  private posts: ForumPost[] = [...FORUM_POSTS_SEED];
  private replies: Map<string, ForumReply[]> = new Map(
    Object.entries(FORUM_REPLIES_SEED).map(([k, v]) => [k, [...v]]),
  );

  findAllPosts(query: QueryForumDto, account?: PublicAccount): ForumPost[] {
    const { category } = query;
    return this.posts
      .filter((post) => !category || post.category === category)
      .filter((post) => canViewContent(post, account));
  }

  findOnePost(id: string, account?: PublicAccount): { post: ForumPost; replies: ForumReply[] } {
    const post = this.posts.find((p) => p.id === id);
    if (!post || !canViewContent(post, account)) {
      throw new NotFoundException(`Forum post not found: ${id}`);
    }
    const replies = (this.replies.get(id) ?? []).filter((reply) => canViewContent(reply, account));
    return { post, replies };
  }

  createPost(input: CreatePostDto, account?: PublicAccount): ForumPost {
    const decision = this.moderationService.evaluate([
      input.title,
      input.body,
      account?.name ?? input.author,
    ]);
    if (decision.action === 'block') {
      throw new BadRequestException('Post contains blocked content.');
    }
    const post: ForumPost = {
      id: randomUUID(),
      category: input.category,
      title: input.title,
      author: account?.name ?? input.author,
      ...(account ? { authorId: account.id } : {}),
      body: input.body,
      createdAt: new Date().toISOString(),
      reportCount: 0,
      autoHidden: false,
      hiddenByAdmin: false,
      moderationStatus: decision.action === 'review' ? 'needs_review' : 'visible',
      moderationHits: decision.hits,
    };
    this.posts = [post, ...this.posts];
    return post;
  }

  createReply(postId: string, input: CreateReplyDto, account?: PublicAccount): ForumReply {
    const post = this.posts.find((p) => p.id === postId);
    if (!post || !canViewContent(post, account)) {
      throw new NotFoundException(`Forum post not found: ${postId}`);
    }
    const decision = this.moderationService.evaluate([input.body, account?.name ?? input.author]);
    if (decision.action === 'block') {
      throw new BadRequestException('Reply contains blocked content.');
    }
    const reply: ForumReply = {
      id: randomUUID(),
      postId,
      author: account?.name ?? input.author,
      ...(account ? { authorId: account.id } : {}),
      body: input.body,
      createdAt: new Date().toISOString(),
      reportCount: 0,
      autoHidden: false,
      hiddenByAdmin: false,
      deleted: false,
      moderationStatus: decision.action === 'review' ? 'needs_review' : 'visible',
      moderationHits: decision.hits,
    };
    const list = this.replies.get(postId) ?? [];
    this.replies.set(postId, [...list, reply]);
    return reply;
  }

  removePost(id: string, account?: PublicAccount): void {
    const index = this.posts.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new NotFoundException(`Forum post not found: ${id}`);
    }
    assertCanMutate(this.posts[index], account);
    this.posts = this.posts.filter((p) => p.id !== id);
    this.replies.delete(id);
  }

  removeReply(postId: string, replyId: string, account?: PublicAccount): void {
    const list = this.replies.get(postId);
    if (!list) {
      throw new NotFoundException(`Forum post not found: ${postId}`);
    }
    const reply = list.find((r) => r.id === replyId);
    if (!reply) {
      throw new NotFoundException(`Forum reply not found: ${replyId}`);
    }
    assertCanMutate(reply, account);
    this.replies.set(
      postId,
      list.filter((r) => r.id !== replyId),
    );
  }

  updatePostModeration(id: string, input: UpdateForumModerationDto): ForumPost {
    const post = this.posts.find((candidate) => candidate.id === id);
    if (!post) {
      throw new NotFoundException(`Forum post not found: ${id}`);
    }
    if (input.hiddenByAdmin !== undefined) post.hiddenByAdmin = input.hiddenByAdmin;
    if (input.moderationStatus !== undefined) post.moderationStatus = input.moderationStatus;
    return post;
  }

  updateReplyModeration(
    postId: string,
    replyId: string,
    input: UpdateForumModerationDto,
  ): ForumReply {
    const list = this.replies.get(postId);
    if (!list) {
      throw new NotFoundException(`Forum post not found: ${postId}`);
    }
    const reply = list.find((candidate) => candidate.id === replyId);
    if (!reply) {
      throw new NotFoundException(`Forum reply not found: ${replyId}`);
    }
    if (input.hiddenByAdmin !== undefined) reply.hiddenByAdmin = input.hiddenByAdmin;
    if (input.moderationStatus !== undefined) reply.moderationStatus = input.moderationStatus;
    return reply;
  }
}

function canViewContent(
  content: Pick<ForumPost | ForumReply, 'autoHidden' | 'hiddenByAdmin'>,
  account?: PublicAccount,
): boolean {
  if (!content.autoHidden && !content.hiddenByAdmin) return true;
  return account?.role === 'admin' || account?.role === 'moderator';
}

function assertCanMutate(
  content: Pick<ForumPost | ForumReply, 'authorId'>,
  account?: PublicAccount,
): void {
  if (!account) return;
  if (account.role === 'admin' || account.role === 'moderator') return;
  if (content.authorId && content.authorId === account.id) return;
  throw new ForbiddenException('Only the author or moderators can mutate this forum content.');
}
