import { Injectable, NotFoundException } from '@nestjs/common';
import { existsSync, readdirSync, statSync, unlinkSync } from 'fs';
import { extname, join, normalize } from 'path';
import { ImageUrlService } from './image-url.service';
import { getUploadDir, UploadFolder } from './multer.config';

const MIME_BY_EXT: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx':
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

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

  listDocumentFiles() {
    const dir = getUploadDir('files');

    if (!existsSync(dir)) {
      return [];
    }

    return readdirSync(dir)
      .filter((name) => name !== '.gitkeep' && !name.startsWith('.'))
      .map((filename) => {
        const absolutePath = join(dir, filename);
        const stats = statSync(absolutePath);

        if (!stats.isFile()) {
          return null;
        }

        return {
          filename,
          url: this.imageUrlService.toFullUrl(`/uploads/files/${filename}`),
          size: stats.size,
          mimeType: MIME_BY_EXT[extname(filename).toLowerCase()] ?? 'application/octet-stream',
          createdAt: stats.birthtime.toISOString(),
          updatedAt: stats.mtime.toISOString(),
        };
      })
      .filter((item): item is NonNullable<typeof item> => !!item)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }

  deleteDocumentFile(filename: string) {
    const safeName = this.assertSafeFilename(filename);
    const absolutePath = this.resolveFilesPath(safeName);

    if (!existsSync(absolutePath)) {
      throw new NotFoundException('Fayl topilmadi');
    }

    unlinkSync(absolutePath);

    return {
      deleted: true,
      filename: safeName,
    };
  }

  private assertSafeFilename(filename: string): string {
    if (
      !filename ||
      filename.includes('..') ||
      filename.includes('/') ||
      filename.includes('\\') ||
      filename.startsWith('.')
    ) {
      throw new NotFoundException('Fayl topilmadi');
    }

    return filename;
  }

  private resolveFilesPath(filename: string): string {
    const uploadDir = normalize(getUploadDir('files'));
    const absolutePath = normalize(join(uploadDir, filename));

    if (!absolutePath.startsWith(uploadDir)) {
      throw new NotFoundException('Fayl topilmadi');
    }

    return absolutePath;
  }
}
