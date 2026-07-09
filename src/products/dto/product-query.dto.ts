import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class ProductQueryDto {
  @IsInt()
  @Min(1)
  @IsOptional()
  categoryId?: number;

  @IsString()
  @IsOptional()
  volume?: string;
}
