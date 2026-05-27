import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateReplyDto {
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  author!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(800)
  body!: string;
}
