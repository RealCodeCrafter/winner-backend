import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LocalizedTextDto {
  @IsString()
  @IsNotEmpty()
  en: string;

  @IsString()
  @IsNotEmpty()
  ru: string;
}

export class OptionalLocalizedTextDto {
  @IsString()
  @IsOptional()
  en?: string;

  @IsString()
  @IsOptional()
  ru?: string;
}
