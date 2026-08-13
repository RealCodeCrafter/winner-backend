import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileStorageService } from './file-storage.service';
import { documentMulterOptions } from './multer.config';

@Controller('upload')
export class UploadController {
  constructor(private readonly fileStorage: FileStorageService) {}

  @Get()
  list() {
    return this.fileStorage.listDocumentFiles();
  }

  @Post()
  @UseInterceptors(FileInterceptor('file', documentMulterOptions))
  upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Fayl yuklang');
    }

    const [url] = this.fileStorage.saveFiles([file], 'files');

    return {
      url,
      originalName: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
    };
  }

  @Delete(':filename')
  remove(@Param('filename') filename: string) {
    return this.fileStorage.deleteDocumentFile(filename);
  }
}
