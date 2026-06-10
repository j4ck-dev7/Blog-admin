import { SessionOptions } from 'express-session';
import { createClient, RedisClientType } from 'redis';
import { ConfigService } from '@nestjs/config';
import RedisStore from 'connect-redis';

export const createSessionOptions = (config: ConfigService): SessionOptions => {
  const redisUrl: string = config.get<string>('REDIS_URL') ?? 'redis://127.0.0.1:6379';
  const redisClient: RedisClientType = createClient({ url: redisUrl });

  redisClient.on('error', (err: Error) => {
    console.error('Redis Client Error', err);
  });

  redisClient.connect().catch((error: Error) => {
    console.error('Failed to connect Redis for session store', error);
  });

  const store = new (RedisStore as any)({
    client: redisClient,
    prefix: config.get<string>('REDIS_SESSION_PREFIX', 'sess:'),
    ttl: 300,
  });

  return {
    store,
    secret: config.get<string>('SESSION_SECRET', 'change-me-in-production'),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: config.get<string>('NODE_ENV') === 'production',
      maxAge: 1000 * 60 * 5,
      sameSite: 'lax',
    },
  };
}