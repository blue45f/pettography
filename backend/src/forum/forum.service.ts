import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { FORUM_POSTS_SEED, FORUM_REPLIES_SEED } from '../data/forum.seed';
import type { ForumPost, ForumReply } from '../common/types';
import type { QueryForumDto } from './dto/query-forum.dto';
import type { CreatePostDto } from './dto/create-post.dto';
import type { CreateReplyDto } from './dto/create-reply.dto';

@Injectable()
export class ForumService {
  private posts: ForumPost[] = [...FORUM_POSTS_SEED];
  private replies: Map<string, ForumReply[]> = new Map(
    Object.entries(FORUM_REPLIES_SEED).map(([k, v]) => [k, [...v]]),
  );

  findAllPosts(query: QueryForumDto): ForumPost[] {
    const { category } = query;
    if (!category) return this.posts;
    return this.posts.filter((p) => p.category === category);
  }

  findOnePost(id: string): { post: ForumPost; replies: ForumReply[] } {
    const post = this.posts.find((p) => p.id === id);
    if (!post) {
      throw new NotFoundException(`Forum post not found: ${id}`);
    }
    const replies = this.replies.get(id) ?? [];
    return { post, replies };
  }

  createPost(input: CreatePostDto): ForumPost {
    const post: ForumPost = {
      id: randomUUID(),
      category: input.category,
      title: input.title,
      author: input.author,
      body: input.body,
      createdAt: new Date().toISOString(),
    };
    this.posts = [post, ...this.posts];
    return post;
  }

  createReply(postId: string, input: CreateReplyDto): ForumReply {
    const post = this.posts.find((p) => p.id === postId);
    if (!post) {
      throw new NotFoundException(`Forum post not found: ${postId}`);
    }
    const reply: ForumReply = {
      id: randomUUID(),
      postId,
      author: input.author,
      body: input.body,
      createdAt: new Date().toISOString(),
    };
    const list = this.replies.get(postId) ?? [];
    this.replies.set(postId, [...list, reply]);
    return reply;
  }

  removePost(id: string): void {
    const index = this.posts.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new NotFoundException(`Forum post not found: ${id}`);
    }
    this.posts = this.posts.filter((p) => p.id !== id);
    this.replies.delete(id);
  }

  removeReply(postId: string, replyId: string): void {
    const list = this.replies.get(postId);
    if (!list) {
      throw new NotFoundException(`Forum post not found: ${postId}`);
    }
    const exists = list.some((r) => r.id === replyId);
    if (!exists) {
      throw new NotFoundException(`Forum reply not found: ${replyId}`);
    }
    this.replies.set(
      postId,
      list.filter((r) => r.id !== replyId),
    );
  }
}
