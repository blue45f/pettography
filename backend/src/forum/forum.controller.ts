import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ForumService } from './forum.service';
import { QueryForumDto } from './dto/query-forum.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateReplyDto } from './dto/create-reply.dto';
import type { ForumPost, ForumReply } from '../common/types';

@Controller('forum')
export class ForumController {
  constructor(private readonly forumService: ForumService) {}

  @Get('posts')
  findAllPosts(@Query() query: QueryForumDto): ForumPost[] {
    return this.forumService.findAllPosts(query);
  }

  @Post('posts')
  createPost(@Body() body: CreatePostDto): ForumPost {
    return this.forumService.createPost(body);
  }

  @Get('posts/:id')
  findOnePost(@Param('id') id: string): { post: ForumPost; replies: ForumReply[] } {
    return this.forumService.findOnePost(id);
  }

  @Post('posts/:id/replies')
  createReply(@Param('id') id: string, @Body() body: CreateReplyDto): ForumReply {
    return this.forumService.createReply(id, body);
  }

  @Delete('posts/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removePost(@Param('id') id: string): void {
    this.forumService.removePost(id);
  }

  @Delete('posts/:id/replies/:replyId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeReply(@Param('id') id: string, @Param('replyId') replyId: string): void {
    this.forumService.removeReply(id, replyId);
  }
}
