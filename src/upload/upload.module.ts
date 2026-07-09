import { Module } from '@nestjs/common';
import { FileStorageService } from './file-storage.service';
import { UploadCleanupService } from './upload-cleanup.service';
import { ImageUrlService } from './image-url.service';

@Module({
  providers: [FileStorageService, UploadCleanupService, ImageUrlService],
  exports: [FileStorageService, UploadCleanupService, ImageUrlService],
})
export class UploadModule {}
