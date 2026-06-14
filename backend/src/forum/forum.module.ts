import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { ModerationModule } from '../moderation/moderation.module'
import { ForumController } from './forum.controller'
import { ForumService } from './forum.service'

@Module({
  imports: [AuthModule, ModerationModule],
  controllers: [ForumController],
  providers: [ForumService],
  exports: [ForumService],
})
export class ForumModule {}
