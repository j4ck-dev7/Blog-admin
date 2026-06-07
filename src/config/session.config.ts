import session, { SessionOptions, Store } from 'express-session';
import { createClient, RedisClientType } from 'redis';
import { ConfigService } from '@nestjs/config';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const connectRedis = require('connect-redis');

interface RedisStoreConstructor {
  new (args: { client: RedisClientType; prefix: string; ttl: number }): Store;
}

const RedisStore: RedisStoreConstructor = connectRedis(session);

export const createSessionOptions = (config: ConfigService): SessionOptions => {
  const redisUrl: string = config.get<string>('REDIS_URL') ?? 'redis://127.0.0.1:6379';
  const redisClient: RedisClientType = createClient({ url: redisUrl });

  redisClient.on('error', (err: Error) => {
    console.error('Redis Client Error', err);
  });

  redisClient.connect().catch((error: Error) => {
    console.error('Failed to connect Redis for session store', error);
  });

  return {
    store: new RedisStore({
      client: redisClient,
      prefix: config.get<string>('REDIS_SESSION_PREFIX', 'sess:'),
      ttl: 300,
    }),
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
