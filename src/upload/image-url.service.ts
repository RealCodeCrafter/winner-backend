import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ImageUrlService {
  constructor(private readonly configService: ConfigService) {}

  getBaseUrl(): string {
    const url = this.configService.get<string>('APP_URL', 'http://localhost:3000');
    return url.replace(/\/$/, '');
  }

  toRelativePath(urlOrPath: string): string | null {
    if (!urlOrPath) {
      return null;
    }

    const match = urlOrPath.match(/\/uploads\/(category|product)\/([^/?#]+)$/);

    if (!match) {
      return null;
    }

    return `/uploads/${match[1]}/${match[2]}`;
  }

  toFullUrl(urlOrPath: string): string {
    const relative = this.toRelativePath(urlOrPath);

    if (!relative) {
      return urlOrPath;
    }

    return `${this.getBaseUrl()}${relative}`;
  }

  toFullUrls(urls: string[] | null | undefined): string[] {
    if (!urls?.length) {
      return [];
    }

    return urls.map((url) => this.toFullUrl(url));
  }

  normalizeForStorage(urls: string[] | undefined): string[] | undefined {
    if (!urls) {
      return undefined;
    }

    return urls.map((url) => this.toFullUrl(url));
  }
}
