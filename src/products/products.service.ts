import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { Category } from '../categories/entities/category.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { UploadCleanupService } from '../upload/upload-cleanup.service';
import { ImageUrlService } from '../upload/image-url.service';
import { LocalizedText } from '../common/types/localized-text.type';
import { PRODUCT_SPEC_FIELDS } from './constants/product-spec.fields';

type CreateProductInput = CreateProductDto & { images: string[] };
type UpdateProductInput = UpdateProductDto & { images?: string[] };
type LocalizedInput = { en?: string; ru?: string };

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    private readonly uploadCleanup: UploadCleanupService,
    private readonly imageUrlService: ImageUrlService,
  ) {}

  async findAll(query: ProductQueryDto = {}) {
    const qb = this.productRepository
      .createQueryBuilder('product')
      .orderBy('product.sortOrder', 'ASC')
      .addOrderBy('product.id', 'ASC');

    if (query.categoryId) {
      qb.andWhere('product.categoryId = :categoryId', {
        categoryId: query.categoryId,
      });
    }

    if (query.volume) {
      qb.andWhere(':volume = ANY(product.volumes)', {
        volume: query.volume,
      });
    }

    const products = await qb
      .leftJoinAndSelect('product.category', 'category')
      .getMany();
    return products.map((item) => this.withImageUrls(item));
  }

  async findOne(id: number) {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['category'],
    });

    if (!product) {
      throw new NotFoundException('Mahsulot topilmadi');
    }

    return this.withImageUrls(product);
  }

  private async findOneRaw(id: number) {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['category'],
    });

    if (!product) {
      throw new NotFoundException('Mahsulot topilmadi');
    }

    return product;
  }

  async create(dto: CreateProductInput) {
    const name = this.normalizeRequiredLocalized(dto.name);
    await this.ensureUniqueName(name);
    await this.ensureCategoryExists(dto.categoryId);

    const product = this.productRepository.create({
      name,
      description: this.normalizeLocalized(dto.description),
      volumes: dto.volumes ?? [],
      viscosityClass: dto.viscosityClass ?? null,
      densityAt15C: dto.densityAt15C ?? null,
      kinematicViscosityAt40C: dto.kinematicViscosityAt40C ?? null,
      kinematicViscosityAt100C: dto.kinematicViscosityAt100C ?? null,
      viscosityIndex: dto.viscosityIndex ?? null,
      flashPoint: dto.flashPoint ?? null,
      pourPoint: dto.pourPoint ?? null,
      baseNumber: dto.baseNumber ?? null,
      categoryId: dto.categoryId,
      sortOrder: dto.sortOrder ?? 0,
      images: this.imageUrlService.normalizeForStorage(dto.images) ?? [],
    });
    const saved = await this.productRepository.save(product);
    return this.findOne(saved.id);
  }

  async update(id: number, dto: UpdateProductInput) {
    const product = await this.findOneRaw(id);
    const {
      images,
      name,
      description,
      categoryId,
      ...fields
    } = dto;
    const updateData: Partial<Product> = { ...fields };

    if (categoryId !== undefined) {
      await this.ensureCategoryExists(categoryId);
      updateData.categoryId = categoryId;
    }

    if (name !== undefined) {
      const nextName = this.mergeRequiredLocalized(product.name, name);
      await this.ensureUniqueName(nextName, id);
      updateData.name = nextName;
    }

    if (description !== undefined) {
      updateData.description = this.mergeLocalized(product.description, description);
    }

    if (images !== undefined) {
      updateData.images =
        this.imageUrlService.normalizeForStorage(images) ?? [];
      this.uploadCleanup.deleteRemoved(product.images, updateData.images);
    }

    await this.productRepository.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: number) {
    const product = await this.findOneRaw(id);

    this.uploadCleanup.deleteByPaths(product.images);
    await this.productRepository.delete(id);

    return { message: 'Mahsulot o\'chirildi' };
  }

  private withImageUrls(product: Product) {
    return this.formatProduct(product, true);
  }

  formatProduct(product: Product, includeCategory = false) {
    const response: Record<string, unknown> = {
      id: product.id,
      name: product.name,
      description: product.description,
      volumes: product.volumes,
      images: this.imageUrlService.toFullUrls(product.images),
    };

    for (const field of PRODUCT_SPEC_FIELDS) {
      response[field] = product[field];
    }

    response.categoryId = product.categoryId;
    response.sortOrder = product.sortOrder;

    if (includeCategory && product.category) {
      response.category = {
        id: product.category.id,
        title: product.category.title,
        images: this.imageUrlService.toFullUrls(product.category.images),
        sortOrder: product.category.sortOrder,
      };
    }

    return response;
  }

  private normalizeRequiredLocalized(text: LocalizedInput): LocalizedText {
    return {
      en: text.en?.trim() ?? '',
      ru: text.ru?.trim() ?? '',
    };
  }

  private normalizeLocalized(text?: LocalizedInput): LocalizedText | null {
    if (!text) {
      return null;
    }

    const en = text.en?.trim() ?? '';
    const ru = text.ru?.trim() ?? '';

    if (!en && !ru) {
      return null;
    }

    return { en, ru };
  }

  private mergeRequiredLocalized(
    current: LocalizedText,
    next: LocalizedInput,
  ): LocalizedText {
    return {
      en: next.en?.trim() ?? current.en,
      ru: next.ru?.trim() ?? current.ru,
    };
  }

  private mergeLocalized(
    current: LocalizedText | null,
    next: LocalizedInput,
  ): LocalizedText | null {
    const merged: LocalizedText = {
      en: next.en?.trim() ?? current?.en ?? '',
      ru: next.ru?.trim() ?? current?.ru ?? '',
    };

    if (!merged.en && !merged.ru) {
      return null;
    }

    return merged;
  }

  private async ensureCategoryExists(categoryId: number) {
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException('Kategoriya topilmadi');
    }
  }

  private async ensureUniqueName(name: LocalizedText, excludeId?: number) {
    const qb = this.productRepository
      .createQueryBuilder('product')
      .where("LOWER(TRIM(product.name->>'en')) = LOWER(TRIM(:name))", {
        name: name.en,
      });

    if (excludeId) {
      qb.andWhere('product.id != :excludeId', { excludeId });
    }

    const exists = await qb.getOne();

    if (exists) {
      throw new ConflictException('Bu nomdagi mahsulot allaqachon mavjud');
    }
  }
}
