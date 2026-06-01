import session, { SessionOptions } from 'express-session';
import connectRedis from 'connect-redis';
import { createClient } from 'redis';
import { ConfigService } from '@nestjs/config';

const RedisStore = (connectRedis as any)(session);

export const createSessionOptions = (config: ConfigService): SessionOptions => {
  const redisUrl = config.get('REDIS_URL') ?? 'redis://127.0.0.1:6379';
  const redisClient = createClient({ url: redisUrl });

  redisClient.on('error', (err) => {
    console.error('Redis Client Error', err);
  });

  redisClient.connect().catch((error) => {
    console.error('Failed to connect Redis for session store', error);
  });

  return {
    store: new RedisStore({
      client: redisClient,
      prefix: config.get('REDIS_SESSION_PREFIX', 'sess:'),
      ttl: 300
    }) as any,
    secret: config.get('SESSION_SECRET', 'change-me-in-production'),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: config.get('NODE_ENV') === 'production',
      maxAge: 1000 * 60 * 5,
      sameSite: 'lax',
    },
  };
}
