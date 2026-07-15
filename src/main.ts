import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { AppModule } from './app.module';
import { buildCorsOptions } from './common/config/cors.config';

async function bootstrap() {
  for (const folder of ['category', 'product'] as const) {
    const uploadsPath = join(process.cwd(), 'uploads', folder);

    if (!existsSync(uploadsPath)) {
      mkdirSync(uploadsPath, { recursive: true });
    }
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger:
      process.env.NODE_ENV === 'production'
        ? ['error', 'warn', 'log']
        : ['error', 'warn', 'log', 'debug'],
  });

  const config = app.get(ConfigService);

  app.setGlobalPrefix('api');
  app.disable('x-powered-by');

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(compression());
  app.use(json({ limit: '1mb' }));
  app.use(urlencoded({ extended: true, limit: '1mb' }));

  app.enableCors(buildCorsOptions(config.get<string>('CORS_ORIGIN', '*')));

  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads',
    maxAge: '7d',
    immutable: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const port = config.get<number>('PORT', 10006);
  await app.listen(port);

  console.log(`Winner API: ${config.get('APP_URL', `http://localhost:${port}`)}/api`);
}

bootstrap();
