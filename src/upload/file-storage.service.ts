import { Injectable, NotFoundException } from '@nestjs/common';
import { createReadStream, existsSync, readdirSync, statSync, unlinkSync } from 'fs';
import { extname, join, normalize } from 'path';
import type { Request, Response } from 'express';
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
      folder === 'files'
        ? this.getDocumentStreamUrl(file.filename)
        : this.imageUrlService.toFullUrl(`/uploads/${folder}/${file.filename}`),
    );
  }

  getDocumentStreamUrl(filename: string): string {
    return `${this.imageUrlService.getBaseUrl()}/api/upload/file/${filename}`;
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
          url: this.getDocumentStreamUrl(filename),
          size: stats.size,
          mimeType: this.getMimeType(filename),
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

  streamDocument(filename: string, req: Request, res: Response) {
    const safeName = this.assertSafeFilename(filename);
    const absolutePath = this.resolveFilesPath(safeName);

    if (!existsSync(absolutePath)) {
      throw new NotFoundException('Fayl topilmadi');
    }

    const stats = statSync(absolutePath);
    const fileSize = stats.size;
    const mimeType = this.getMimeType(safeName);
    const range = req.headers.range;

    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Content-Type', mimeType);

    if (mimeType === 'application/pdf') {
      res.setHeader('Content-Disposition', `inline; filename="${safeName}"`);
    }

    if (!range) {
      res.status(200);
      res.setHeader('Content-Length', fileSize);
      createReadStream(absolutePath).pipe(res);
      return;
    }

    const match = /^bytes=(\d*)-(\d*)$/.exec(range);

    if (!match) {
      res.status(416);
      res.setHeader('Content-Range', `bytes */${fileSize}`);
      res.end();
      return;
    }

    let start = match[1] ? parseInt(match[1], 10) : 0;
    let end = match[2] ? parseInt(match[2], 10) : fileSize - 1;

    if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= fileSize) {
      res.status(416);
      res.setHeader('Content-Range', `bytes */${fileSize}`);
      res.end();
      return;
    }

    end = Math.min(end, fileSize - 1);
    const chunkSize = end - start + 1;

    res.status(206);
    res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
    res.setHeader('Content-Length', chunkSize);
    createReadStream(absolutePath, { start, end }).pipe(res);
  }

  private getMimeType(filename: string): string {
    return MIME_BY_EXT[extname(filename).toLowerCase()] ?? 'application/octet-stream';
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
