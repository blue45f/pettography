import { IsBoolean, IsEnum, IsOptional } from 'class-validator';

const MODERATION_STATUSES = ['visible', 'needs_review'] as const;

export class UpdateForumModerationDto {
  @IsOptional()
  @IsBoolean()
  hiddenByAdmin?: boolean;

  @IsOptional()
  @IsEnum(MODERATION_STATUSES)
  moderationStatus?: (typeof MODERATION_STATUSES)[number];
}
