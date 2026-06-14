import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { CurrentAccount, Public, Roles } from '../auth/auth.decorators'
import { AuthGuard } from '../auth/auth.guard'
import { ForumService } from './forum.service'
import { QueryForumDto } from './dto/query-forum.dto'
import { CreatePostDto } from './dto/create-post.dto'
import { CreateReplyDto } from './dto/create-reply.dto'
import { UpdateForumModerationDto } from './dto/update-forum-moderation.dto'
import type { ForumPost, ForumReply, PublicAccount } from '../common/types'

@Controller('forum')
export class ForumController {
  constructor(private readonly forumService: ForumService) {}

  @Get('posts')
  @Public()
  @UseGuards(AuthGuard)
  findAllPosts(
    @Query() query: QueryForumDto,
    @CurrentAccount() account?: PublicAccount
  ): ForumPost[] {
    return this.forumService.findAllPosts(query, account)
  }

  @Post('posts')
  @UseGuards(AuthGuard)
  createPost(@Body() body: CreatePostDto, @CurrentAccount() account?: PublicAccount): ForumPost {
    return this.forumService.createPost(body, account)
  }

  @Get('posts/:id')
  @Public()
  @UseGuards(AuthGuard)
  findOnePost(
    @Param('id') id: string,
    @CurrentAccount() account?: PublicAccount
  ): { post: ForumPost; replies: ForumReply[] } {
    return this.forumService.findOnePost(id, account)
  }

  @Post('posts/:id/replies')
  @UseGuards(AuthGuard)
  createReply(
    @Param('id') id: string,
    @Body() body: CreateReplyDto,
    @CurrentAccount() account?: PublicAccount
  ): ForumReply {
    return this.forumService.createReply(id, body, account)
  }

  @Delete('posts/:id')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  removePost(@Param('id') id: string, @CurrentAccount() account?: PublicAccount): void {
    this.forumService.removePost(id, account)
  }

  @Delete('posts/:id/replies/:replyId')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  removeReply(
    @Param('id') id: string,
    @Param('replyId') replyId: string,
    @CurrentAccount() account?: PublicAccount
  ): void {
    this.forumService.removeReply(id, replyId, account)
  }

  @Patch('admin/posts/:id/moderation')
  @UseGuards(AuthGuard)
  @Roles('admin', 'moderator')
  updatePostModeration(@Param('id') id: string, @Body() body: UpdateForumModerationDto): ForumPost {
    return this.forumService.updatePostModeration(id, body)
  }

  @Patch('admin/posts/:id/replies/:replyId/moderation')
  @UseGuards(AuthGuard)
  @Roles('admin', 'moderator')
  updateReplyModeration(
    @Param('id') id: string,
    @Param('replyId') replyId: string,
    @Body() body: UpdateForumModerationDto
  ): ForumReply {
    return this.forumService.updateReplyModeration(id, replyId, body)
  }
}
