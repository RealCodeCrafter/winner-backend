import { IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class ProductSearchDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsInt()
  @Min(1)
  @Max(20)
  @IsOptional()
  limit?: number;
}
