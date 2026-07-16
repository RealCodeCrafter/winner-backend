import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  LocalizedTextDto,
  OptionalLocalizedTextDto,
} from '../../common/dto/localized-text.dto';
import { PRODUCT_SPEC_FIELDS } from '../constants/product-spec.fields';

export class CreateProductDto {
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  name: LocalizedTextDto;

  @ValidateNested()
  @Type(() => OptionalLocalizedTextDto)
  @IsOptional()
  description?: OptionalLocalizedTextDto;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  volumes?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  viscosityClass?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  densityAt15C?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  kinematicViscosityAt40C?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  kinematicViscosityAt100C?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  viscosityIndex?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  flashPoint?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  pourPoint?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  baseNumber?: string[];

  @IsInt()
  @Min(1)
  categoryId: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;
}

export { PRODUCT_SPEC_FIELDS };
