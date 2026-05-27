import { IsString, MinLength } from 'class-validator';

export class JoinRoomDto {
  @IsString()
  @MinLength(1)
  vetId!: string;
}
