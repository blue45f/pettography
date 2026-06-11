import { IsString, MaxLength, MinLength } from 'class-validator';

/** REST body for POST /consult/vets/:id/messages — vetId comes from the path. */
export class PostMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  body!: string;
}
