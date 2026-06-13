import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  name: process.env.APP_NAME ?? 'smartersprint',
  env: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.APP_PORT ?? 3000),
  url: process.env.APP_URL ?? 'http://localhost:3000',
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:4200',
  logLevel: process.env.LOG_LEVEL ?? 'info',
}));
