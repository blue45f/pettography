import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}

export class LoginDto {
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password!: string;
}

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  currentPassword?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  newPassword?: string;
}

export class WithdrawAccountDto {
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password!: string;
}
