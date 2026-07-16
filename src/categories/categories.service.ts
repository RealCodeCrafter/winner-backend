import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { Product } from '../products/entities/product.entity';
import { PRODUCT_SPEC_FIELDS } from '../products/constants/product-spec.fields';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { UploadCleanupService } from '../upload/upload-cleanup.service';
import { ImageUrlService } from '../upload/image-url.service';
import { LocalizedText } from '../common/types/localized-text.type';

type CreateCategoryInput = CreateCategoryDto & { images: string[] };
type UpdateCategoryInput = UpdateCategoryDto & { images?: string[] };
type LocalizedInput = { en?: string; ru?: string };

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    private readonly uploadCleanup: UploadCleanupService,
    private readonly imageUrlService: ImageUrlService,
  ) {}

  async findAll() {
    const categories = await this.categoryRepository
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.products', 'product')
      .orderBy('category.sortOrder', 'ASC')
      .addOrderBy('category.id', 'ASC')
      .addOrderBy('product.sortOrder', 'ASC')
      .addOrderBy('product.id', 'ASC')
      .getMany();

    return categories.map((item) => this.withImageUrls(item));
  }

  async findOne(id: number) {
    const category = await this.categoryRepository
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.products', 'product')
      .where('category.id = :id', { id })
      .orderBy('product.sortOrder', 'ASC')
      .addOrderBy('product.id', 'ASC')
      .getOne();

    if (!category) {
      throw new NotFoundException('Kategoriya topilmadi');
    }

    return this.withImageUrls(category);
  }

  private async findOneRaw(id: number) {
    const category = await this.categoryRepository.findOne({ where: { id } });

    if (!category) {
      throw new NotFoundException('Kategoriya topilmadi');
    }

    return category;
  }

  async create(dto: CreateCategoryInput) {
    const title = this.normalizeRequiredLocalized(dto.title);
    await this.ensureUniqueTitle(title);

    const category = this.categoryRepository.create({
      title,
      sortOrder: dto.sortOrder ?? 0,
      images: this.imageUrlService.normalizeForStorage(dto.images) ?? [],
    });
    const saved = await this.categoryRepository.save(category);
    return this.withImageUrls(saved);
  }

  async update(id: number, dto: UpdateCategoryInput) {
    const category = await this.findOneRaw(id);
    const updateData: Partial<Category> = {};

    if (dto.title !== undefined) {
      const nextTitle = this.mergeRequiredLocalized(category.title, dto.title);
      await this.ensureUniqueTitle(nextTitle, id);
      updateData.title = nextTitle;
    }

    if (dto.sortOrder !== undefined) {
      updateData.sortOrder = dto.sortOrder;
    }

    if (dto.images !== undefined) {
      updateData.images =
        this.imageUrlService.normalizeForStorage(dto.images) ?? [];
      this.uploadCleanup.deleteRemoved(category.images, updateData.images);
    }

    await this.categoryRepository.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: number) {
    const category = await this.findOneRaw(id);

    this.uploadCleanup.deleteByPaths(category.images);
    await this.categoryRepository.delete(id);

    return { message: 'Kategoriya o\'chirildi' };
  }

  private withImageUrls(category: Category) {
    const products = (category.products ?? []).map((product) =>
      this.mapProduct(product),
    );

    return {
      ...category,
      images: this.imageUrlService.toFullUrls(category.images),
      products,
    };
  }

  private mapProduct(product: Product) {
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

    return response;
  }

  private normalizeRequiredLocalized(text: LocalizedInput): LocalizedText {
    return {
      en: text.en?.trim() ?? '',
      ru: text.ru?.trim() ?? '',
    };
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

  private async ensureUniqueTitle(title: LocalizedText, excludeId?: number) {
    const qb = this.categoryRepository
      .createQueryBuilder('category')
      .where("LOWER(TRIM(category.title->>'en')) = LOWER(TRIM(:title))", {
        title: title.en,
      });

    if (excludeId) {
      qb.andWhere('category.id != :excludeId', { excludeId });
    }

    const exists = await qb.getOne();

    if (exists) {
      throw new ConflictException('Bu nomdagi kategoriya allaqachon mavjud');
    }
  }
}
