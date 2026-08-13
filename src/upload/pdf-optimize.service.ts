import { Injectable, Logger } from '@nestjs/common';
import { execFile } from 'child_process';
import { existsSync, renameSync, statSync, unlinkSync } from 'fs';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

@Injectable()
export class PdfOptimizeService {
  private readonly logger = new Logger(PdfOptimizeService.name);
  private ghostscriptChecked = false;
  private ghostscriptBin: string | null = null;

  async optimizeIfPossible(filePath: string): Promise<number> {
    const originalSize = statSync(filePath).size;
    const bin = await this.resolveGhostscript();

    if (!bin) {
      return originalSize;
    }

    const outputPath = `${filePath}.optimized.pdf`;

    try {
      await execFileAsync(
        bin,
        [
          '-sDEVICE=pdfwrite',
          '-dCompatibilityLevel=1.4',
          '-dPDFSETTINGS=/ebook',
          '-dNOPAUSE',
          '-dQUIET',
          '-dBATCH',
          `-sOutputFile=${outputPath}`,
          filePath,
        ],
        { timeout: 120_000 },
      );

      if (!existsSync(outputPath)) {
        return originalSize;
      }

      const optimizedSize = statSync(outputPath).size;

      // Faqat haqiqatan kichikroq bo'lsa almashtiramiz
      if (optimizedSize > 0 && optimizedSize < originalSize) {
        unlinkSync(filePath);
        renameSync(outputPath, filePath);
        this.logger.log(
          `PDF siqildi: ${originalSize} -> ${optimizedSize} bytes`,
        );
        return optimizedSize;
      }

      unlinkSync(outputPath);
      return originalSize;
    } catch (error) {
      if (existsSync(outputPath)) {
        unlinkSync(outputPath);
      }

      this.logger.warn(
        `PDF optimize o'tkazib yuborildi: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
      return originalSize;
    }
  }

  private async resolveGhostscript(): Promise<string | null> {
    if (this.ghostscriptChecked) {
      return this.ghostscriptBin;
    }

    this.ghostscriptChecked = true;
    const candidates = process.platform === 'win32' ? ['gswin64c', 'gswin32c', 'gs'] : ['gs'];

    for (const bin of candidates) {
      try {
        await execFileAsync(bin, ['-v'], { timeout: 5_000 });
        this.ghostscriptBin = bin;
        return bin;
      } catch {
        // keyingi candidate
      }
    }

    this.logger.warn(
      'Ghostscript topilmadi — PDF avtomatik siqilmaydi (ixtiyoriy)',
    );
    this.ghostscriptBin = null;
    return null;
  }
}
