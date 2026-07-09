import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Public } from '../common/decorators/public.decorator';
import { categoryMulterOptions } from '../upload/multer.config';
import { FileStorageService } from '../upload/file-storage.service';
import { validateDto, parseCategoryFormBody } from '../common/utils/validate-dto';

@Controller('categories')
export class CategoriesController {
  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly fileStorage: FileStorageService,
  ) {}

  @Public()
  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  @Public()
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.findOne(id);
  }

  @Post()
  @UseInterceptors(FilesInterceptor('images', 20, categoryMulterOptions))
  async create(
    @Body() body: Record<string, string>,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const dto = await validateDto(
      CreateCategoryDto,
      parseCategoryFormBody({
        ...body,
        sortOrder: body.sortOrder ?? '0',
      }),
    );

    const images = this.fileStorage.saveFiles(files, 'category');

    if (!images.length) {
      throw new BadRequestException('Kamida bitta rasm yuklang');
    }

    return this.categoriesService.create({ ...dto, images });
  }

  @Patch(':id')
  @UseInterceptors(FilesInterceptor('images', 20, categoryMulterOptions))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Record<string, string>,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const dto = await validateDto(UpdateCategoryDto, parseCategoryFormBody(body));

    const images = this.fileStorage.saveFiles(files, 'category');

    if (images.length) {
      return this.categoriesService.update(id, { ...dto, images });
    }

    return this.categoriesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.remove(id);
  }
}
