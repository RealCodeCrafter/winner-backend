import { Injectable } from '@nestjs/common';
import { ImageUrlService } from './image-url.service';
import { UploadFolder } from './multer.config';

@Injectable()
export class FileStorageService {
  constructor(private readonly imageUrlService: ImageUrlService) {}

  saveFiles(
    files: Express.Multer.File[] | undefined,
    folder: UploadFolder,
  ): string[] {
    if (!files?.length) {
      return [];
    }

    return files.map((file) =>
      this.imageUrlService.toFullUrl(`/uploads/${folder}/${file.filename}`),
    );
  }
}
