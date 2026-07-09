import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

export const buildCorsOptions = (originEnv = '*'): CorsOptions => {
  const value = originEnv.trim();

  if (value === '*') {
    return {
      origin: '*',
      credentials: false,
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    };
  }

  const origins = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    origin: origins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  };
};
