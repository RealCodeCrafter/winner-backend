import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { FileStorageService } from './file-storage.service';
import { documentMulterOptions } from './multer.config';
import { PdfOptimizeService } from './pdf-optimize.service';

@Controller('upload')
export class UploadController {
  constructor(
    private readonly fileStorage: FileStorageService,
    private readonly pdfOptimize: PdfOptimizeService,
  ) {}

  @Get()
  list() {
    return this.fileStorage.listDocumentFiles();
  }

  @Public()
  @Get('file/:filename')
  stream(
    @Param('filename') filename: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    this.fileStorage.streamDocument(filename, req, res);
  }

  @Post()
  @UseInterceptors(FileInterceptor('file', documentMulterOptions))
  async upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Fayl yuklang');
    }

    let size = file.size;

    if (file.mimetype === 'application/pdf' && file.path) {
      size = await this.pdfOptimize.optimizeIfPossible(file.path);
    }

    const [url] = this.fileStorage.saveFiles([file], 'files');

    return {
      url,
      originalName: file.originalname,
      size,
      mimeType: file.mimetype,
    };
  }

  @Delete(':filename')
  remove(@Param('filename') filename: string) {
    return this.fileStorage.deleteDocumentFile(filename);
  }
}
