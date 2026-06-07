import session, { SessionOptions, Store } from 'express-session';
import connectRedis from 'connect-redis';
import { createClient, RedisClientType } from 'redis';
import { ConfigService } from '@nestjs/config';

const RedisStore = connectRedis(session);

export const createSessionOptions = (config: ConfigService): SessionOptions => {
  const redisUrl: string = config.get('REDIS_URL') ?? 'redis://127.0.0.1:6379';
  const redisClient: RedisClientType = createClient({ url: redisUrl });

  redisClient.on('error', (err: Error) => {
    console.error('Redis Client Error', err);
  });

  redisClient.connect().catch((error: Error) => {
    console.error('Failed to connect Redis for session store', error);
  });

  return {
    store: new RedisStore({
      client: redisClient as unknown as RedisClientType,
      prefix: config.get('REDIS_SESSION_PREFIX', 'sess:'),
      ttl: 300,
    }) as Store,
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
