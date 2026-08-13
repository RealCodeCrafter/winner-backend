import { Module } from '@nestjs/common';
import { FileStorageService } from './file-storage.service';
import { UploadCleanupService } from './upload-cleanup.service';
import { ImageUrlService } from './image-url.service';
import { UploadController } from './upload.controller';
import { PdfOptimizeService } from './pdf-optimize.service';

@Module({
  controllers: [UploadController],
  providers: [
    FileStorageService,
    UploadCleanupService,
    ImageUrlService,
    PdfOptimizeService,
  ],
  exports: [FileStorageService, UploadCleanupService, ImageUrlService],
})
export class UploadModule {}
