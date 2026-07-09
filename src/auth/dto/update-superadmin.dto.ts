import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateSuperadminDto {
  @IsString()
  @IsOptional()
  username?: string;

  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @IsString()
  @IsOptional()
  @MinLength(6)
  newPassword?: string;
}
