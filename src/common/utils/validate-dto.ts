import { BadRequestException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PRODUCT_SPEC_FIELDS } from '../../products/constants/product-spec.fields';

export async function validateDto<T extends object>(
  cls: new () => T,
  plain: object,
): Promise<T> {
  const instance = plainToInstance(cls, plain, {
    enableImplicitConversion: true,
  });

  const errors = await validate(instance);

  if (errors.length > 0) {
    const messages = errors
      .flatMap((error) => Object.values(error.constraints ?? {}))
      .join(', ');

    throw new BadRequestException(messages || 'Noto\'g\'ri ma\'lumot');
  }

  return instance;
}

export function parseCommaList(value?: string): string[] | undefined {
  if (value === undefined) {
    return undefined;
  }

  const items = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  return items;
}

const PRODUCT_LOCALIZED_FIELDS = ['name', 'description'] as const;

function parseSpecArray(value?: string): string[] | undefined {
  if (value === undefined || value.trim() === '') {
    return undefined;
  }

  const trimmed = value.trim();

  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;

      if (!Array.isArray(parsed)) {
        throw new Error();
      }

      return parsed.map((item) => String(item).trim()).filter(Boolean);
    } catch {
      throw new BadRequestException(
        'Texnik maydonlar JSON array bo\'lishi kerak, masalan: ["5W-40", "SAE J 300"]',
      );
    }
  }

  const items = parseCommaList(trimmed);

  return items?.length ? items : undefined;
}

function parseLocalizedField(
  body: Record<string, string>,
  field: (typeof PRODUCT_LOCALIZED_FIELDS)[number],
) {
  const en = body[`${field}_en`]?.trim();
  const ru = body[`${field}_ru`]?.trim();
  const hasEn = en !== undefined && en !== '';
  const hasRu = ru !== undefined && ru !== '';

  if (!hasEn && !hasRu) {
    return undefined;
  }

  return {
    en: en ?? '',
    ru: ru ?? '',
  };
}

export function parseProductFormBody(body: Record<string, string>) {
  const data: Record<string, unknown> = {};

  for (const field of PRODUCT_LOCALIZED_FIELDS) {
    const value = parseLocalizedField(body, field);
    if (value !== undefined) {
      data[field] = value;
    }
  }

  if (body.volumes !== undefined && body.volumes !== '') {
    data.volumes = parseCommaList(body.volumes);
  }

  for (const field of PRODUCT_SPEC_FIELDS) {
    const value = parseSpecArray(body[field]);
    if (value !== undefined) {
      data[field] = value;
    }
  }

  if (body.categoryId !== undefined && body.categoryId !== '') {
    data.categoryId = Number(body.categoryId);
  }

  if (body.sortOrder !== undefined && body.sortOrder !== '') {
    data.sortOrder = Number(body.sortOrder);
  }

  return data;
}

export function parseCategoryFormBody(body: Record<string, string>) {
  const data: Record<string, unknown> = {};

  const titleEn = body.title_en?.trim();
  const titleRu = body.title_ru?.trim();
  const hasTitleEn = titleEn !== undefined && titleEn !== '';
  const hasTitleRu = titleRu !== undefined && titleRu !== '';

  if (hasTitleEn || hasTitleRu) {
    data.title = {
      en: titleEn ?? '',
      ru: titleRu ?? '',
    };
  }

  if (body.sortOrder !== undefined && body.sortOrder !== '') {
    data.sortOrder = Number(body.sortOrder);
  }

  return data;
}
