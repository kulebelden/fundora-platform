import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Request } from 'express';
import { AppModule } from './app.module';
import { EnvironmentVariables } from './config/env.validation';
import cookieParser from 'cookie-parser';
import { UPLOADS_ROOT, UPLOADS_URL_PREFIX } from './uploads/uploads.constants';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Uploaded campaign photos. Only files the upload endpoint wrote (named by
  // UUID, typed by their sniffed bytes) live here; no listings, no dotfiles.
  app.useStaticAssets(UPLOADS_ROOT, {
    prefix: `${UPLOADS_URL_PREFIX}/`,
    index: false,
    dotfiles: 'deny',
    // Let non-GET requests (the upload endpoint shares this prefix) and misses reach Nest.
    fallthrough: true,
    maxAge: '7d',
    setHeaders: (res) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Content-Security-Policy', "default-src 'none'");
    },
  });
  app.use((req: Request, _res: unknown, next: (err?: unknown) => void) => {
    if (
      typeof req.path === 'string' &&
      req.path.startsWith('/api/v1/webhooks')
    ) {
      let body = '';
      req.on('data', (chunk: Buffer) => {
        body += chunk.toString();
        if (body.length > 1048576) {
          req.destroy();
          next(new Error('Request body too large'));
          return;
        }
      });
      req.on('end', () => {
        (req as Request & { rawBody?: string }).rawBody = body;
        next();
      });
    } else {
      next();
    }
  });
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  app.enableShutdownHooks();

  const config = app.get<ConfigService<EnvironmentVariables, true>>(ConfigService);
  const port = config.get('PORT', { infer: true });
  await app.listen(port);
  new Logger('Bootstrap').log(`Fundora API listening on port ${port}`);
}

bootstrap().catch((error: unknown) => {
  new Logger('Bootstrap').error(error instanceof Error ? error.stack : String(error));
  process.exit(1);
});
