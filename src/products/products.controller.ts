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
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { Public } from '../common/decorators/public.decorator';
import { productMulterOptions } from '../upload/multer.config';
import { FileStorageService } from '../upload/file-storage.service';
import {
  parseProductFormBody,
  validateDto,
} from '../common/utils/validate-dto';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly fileStorage: FileStorageService,
  ) {}

  @Public()
  @Get()
  findAll(@Query() query: ProductQueryDto) {
    return this.productsService.findAll(query);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }

  @Post()
  @UseInterceptors(FilesInterceptor('images', 20, productMulterOptions))
  async create(
    @Body() body: Record<string, string>,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const dto = await validateDto(
      CreateProductDto,
      parseProductFormBody(body),
    );

    const images = this.fileStorage.saveFiles(files, 'product');

    if (!images.length) {
      throw new BadRequestException('Kamida bitta rasm yuklang');
    }

    return this.productsService.create({ ...dto, images });
  }

  @Patch(':id')
  @UseInterceptors(FilesInterceptor('images', 20, productMulterOptions))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Record<string, string>,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const dto = await validateDto(
      UpdateProductDto,
      parseProductFormBody(body),
    );

    const images = this.fileStorage.saveFiles(files, 'product');

    if (images.length) {
      return this.productsService.update(id, { ...dto, images });
    }

    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.remove(id);
  }
}
