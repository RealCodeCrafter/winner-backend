import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { randomBytes } from 'crypto';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

export type UploadFolder = 'category' | 'product';

const ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

export const getUploadDir = (folder: UploadFolder) =>
  join(process.cwd(), 'uploads', folder);

export const ensureUploadDir = (folder: UploadFolder) => {
  const dir = getUploadDir(folder);

  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  return dir;
};

export const safeExtension = (originalname: string) => {
  const ext = extname(originalname).toLowerCase();
  return ALLOWED_EXT.includes(ext) ? ext : '.jpg';
};

export const createImageMulterOptions = (folder: UploadFolder) => ({
  storage: diskStorage({
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
      const unique = `${Date.now()}-${randomBytes(8).toString('hex')}${safeExtension(file.originalname)}`;
      cb(null, unique);
    },
  }),
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

export const categoryMulterOptions = createImageMulterOptions('category');
export const productMulterOptions = createImageMulterOptions('product');
