import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { randomBytes } from 'crypto';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

export type UploadFolder = 'category' | 'product' | 'files';

const ALLOWED_IMAGE_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
const ALLOWED_DOCUMENT_EXT = ['.pdf', '.doc', '.docx'];

const ALLOWED_DOCUMENT_MIME = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

export const getUploadDir = (folder: UploadFolder) =>
  join(process.cwd(), 'uploads', folder);

export const ensureUploadDir = (folder: UploadFolder) => {
  const dir = getUploadDir(folder);

  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  return dir;
};

export const safeImageExtension = (originalname: string) => {
  const ext = extname(originalname).toLowerCase();
  return ALLOWED_IMAGE_EXT.includes(ext) ? ext : '.jpg';
};

export const safeDocumentExtension = (originalname: string) => {
  const ext = extname(originalname).toLowerCase();
  return ALLOWED_DOCUMENT_EXT.includes(ext) ? ext : null;
};

const createDiskStorage = (
  folder: UploadFolder,
  resolveExtension: (originalname: string) => string | null,
) =>
  diskStorage({
    destination: (
      _req: Express.Request,
      _file: Express.Multer.File,
      cb: (error: Error | null, destination: string) => void,
    ) => {
      cb(null, ensureUploadDir(folder));
    },
    filename: (
      _req: Express.Request,
      file: Express.Multer.File,
      cb: (error: Error | null, filename: string) => void,
    ) => {
      const ext = resolveExtension(file.originalname);

      if (!ext) {
        return cb(
          new BadRequestException('Fayl kengaytmasi ruxsat etilmagan'),
          '',
        );
      }

      const unique = `${Date.now()}-${randomBytes(8).toString('hex')}${ext}`;
      cb(null, unique);
    },
  });

export const createImageMulterOptions = (folder: UploadFolder) => ({
  storage: createDiskStorage(folder, safeImageExtension),
  fileFilter: (
    _req: Express.Request,
    file: Express.Multer.File,
    cb: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    if (!file.mimetype.match(/\/(jpg|jpeg|png|webp|gif)$/)) {
      return cb(
        new BadRequestException('Faqat rasm fayllari ruxsat etilgan'),
        false,
      );
    }
    cb(null, true);
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

export const createDocumentMulterOptions = (folder: UploadFolder) => ({
  storage: createDiskStorage(folder, safeDocumentExtension),
  fileFilter: (
    _req: Express.Request,
    file: Express.Multer.File,
    cb: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    const ext = safeDocumentExtension(file.originalname);

    if (!ext || !ALLOWED_DOCUMENT_MIME.has(file.mimetype)) {
      return cb(
        new BadRequestException('Faqat PDF va Word fayllari ruxsat etilgan'),
        false,
      );
    }

    cb(null, true);
  },
  limits: { fileSize: 100 * 1024 * 1024 },
});

export const categoryMulterOptions = createImageMulterOptions('category');
export const productMulterOptions = createImageMulterOptions('product');
export const documentMulterOptions = createDocumentMulterOptions('files');