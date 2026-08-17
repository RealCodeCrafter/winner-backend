import { IsInt, IsString, Min, MinLength } from 'class-validator';

export class ReorderProductImageDto {
  @IsString()
  @MinLength(1)
  imageUrl: string;

  /** 1-based o'rin: 1 = birinchi, oxirgi raqam = oxirida */
  @IsInt()
  @Min(1)
  position: number;
}
