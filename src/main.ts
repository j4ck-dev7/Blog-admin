import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';
import session from 'express-session';
import { ConfigService } from '@nestjs/config';
import { createSessionOptions } from './config/session.config.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  app.use(session(createSessionOptions(config)));

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true
  }))

  await app.listen(process.env.PORT ?? 5000);
}

bootstrap();