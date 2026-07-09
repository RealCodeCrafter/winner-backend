import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { OptionalLocalizedTextDto } from '../../common/dto/localized-text.dto';

export class UpdateProductDto {
  @ValidateNested()
  @Type(() => OptionalLocalizedTextDto)
  @IsOptional()
  name?: OptionalLocalizedTextDto;

  @ValidateNested()
  @Type(() => OptionalLocalizedTextDto)
  @IsOptional()
  tag?: OptionalLocalizedTextDto;

  @ValidateNested()
  @Type(() => OptionalLocalizedTextDto)
  @IsOptional()
  description?: OptionalLocalizedTextDto;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  volumes?: string[];

  @IsString()
  @IsOptional()
  viscosity?: string;

  @IsString()
  @IsOptional()
  apiStandard?: string;

  @IsString()
  @IsOptional()
  aceaStandard?: string;

  @ValidateNested()
  @Type(() => OptionalLocalizedTextDto)
  @IsOptional()
  manufacturedIn?: OptionalLocalizedTextDto;

  @IsInt()
  @Min(1)
  @IsOptional()
  categoryId?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;
}
