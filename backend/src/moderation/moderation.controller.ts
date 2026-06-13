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
  UseGuards,
} from '@nestjs/common';
import type { ForbiddenWordRule } from '../common/types';
import { Roles } from '../auth/auth.decorators';
import { AuthGuard } from '../auth/auth.guard';
import type {
  CreateForbiddenWordRuleDto,
  UpdateForbiddenWordRuleDto,
} from './dto/forbidden-word-rule.dto';
import { ModerationService } from './moderation.service';

@Controller('moderation')
@UseGuards(AuthGuard)
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  @Get('admin/forbidden-words')
  @Roles('admin', 'moderator')
  listForbiddenWords(): ForbiddenWordRule[] {
    return this.moderationService.listForbiddenWords();
  }

  @Post('admin/forbidden-words')
  @Roles('admin', 'moderator')
  createForbiddenWord(@Body() body: CreateForbiddenWordRuleDto): ForbiddenWordRule {
    return this.moderationService.createForbiddenWord(body);
  }

  @Patch('admin/forbidden-words/:id')
  @Roles('admin', 'moderator')
  updateForbiddenWord(
    @Param('id') id: string,
    @Body() body: UpdateForbiddenWordRuleDto,
  ): ForbiddenWordRule {
    return this.moderationService.updateForbiddenWord(id, body);
  }

  @Delete('admin/forbidden-words/:id')
  @Roles('admin', 'moderator')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeForbiddenWord(@Param('id') id: string): void {
    this.moderationService.removeForbiddenWord(id);
  }
}
