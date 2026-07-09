import { Injectable, Logger } from '@nestjs/common';
import { existsSync, unlinkSync } from 'fs';
import { join, normalize } from 'path';
import { ImageUrlService } from './image-url.service';
import { getUploadDir, UploadFolder } from './multer.config';

@Injectable()
export class UploadCleanupService {
  private readonly logger = new Logger(UploadCleanupService.name);

  constructor(private readonly imageUrlService: ImageUrlService) {}

  deleteByPaths(paths: Array<string | null | undefined>) {
    const unique = [...new Set(paths.filter((p): p is string => !!p))];
    unique.forEach((path) => this.deleteFile(path));
  }

  deleteRemoved(
    oldPaths: Array<string | null | undefined>,
    newPaths: Array<string | null | undefined>,
  ) {
    const normalizePaths = (list: Array<string | null | undefined>) =>
      new Set(
        list
          .filter((p): p is string => !!p)
          .map((p) => this.imageUrlService.toFullUrl(p)),
      );

    const oldSet = normalizePaths(oldPaths);
    const newSet = normalizePaths(newPaths);

    const removed = [...oldSet].filter((path) => !newSet.has(path));
    this.deleteByPaths(removed);
  }

  private deleteFile(filePath: string) {
    const absolutePath = this.resolveSafePath(filePath);

    if (!absolutePath) {
      return;
    }

    if (!existsSync(absolutePath)) {
      return;
    }

    try {
      unlinkSync(absolutePath);
      this.logger.log(`Rasm o'chirildi: ${filePath}`);
    } catch {
      this.logger.warn(`Rasm o'chirilmadi: ${filePath}`);
    }
  }

  private resolveSafePath(filePath: string): string | null {
    const relative = this.imageUrlService.toRelativePath(filePath);

    if (!relative) {
      return null;
    }

    const match = relative.match(/^\/uploads\/(category|product)\/(.+)$/);

    if (!match) {
      return null;
    }

    const folder = match[1] as UploadFolder;
    const filename = match[2];

    if (
      !filename ||
      filename.includes('..') ||
      filename.includes('/') ||
      filename.includes('\\')
    ) {
      return null;
    }

    const uploadDir = normalize(getUploadDir(folder));
    const absolutePath = normalize(join(uploadDir, filename));

    if (!absolutePath.startsWith(uploadDir)) {
      return null;
    }

    return absolutePath;
  }
}
