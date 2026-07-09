import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min, ValidateNested } from 'class-validator';
import { OptionalLocalizedTextDto } from '../../common/dto/localized-text.dto';

export class UpdateCategoryDto {
  @ValidateNested()
  @Type(() => OptionalLocalizedTextDto)
  @IsOptional()
  title?: OptionalLocalizedTextDto;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;
}
