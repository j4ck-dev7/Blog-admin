import { createClient, RedisClientType } from 'redis';
import { ConfigService } from '@nestjs/config';

export const createRedisClient = (config: ConfigService): RedisClientType => {
  const redisUrl = config.get('REDIS_URL') ?? 'redis://127.0.0.1:6379';
  const client = createClient({ url: redisUrl });

  client.on('error', (err) => {
    console.error('Redis Client Error', err);
  });

  client.connect().catch((error) => {
    console.error('Redis connection failed', error);
  });

  return client;
}

export const RedisClientProvider = {
  provide: 'REDIS_CLIENT',
  useFactory: (config: ConfigService) => createRedisClient(config),
  inject: [ConfigService],
};

export const getRedisConnectionOptions = (config: ConfigService) => {
  return {
    url: config.get('REDIS_URL') ?? 'redis://127.0.0.1:6379',
    socket: {
      connectTimeout: Number(config.get('REDIS_CONNECT_TIMEOUT', 5000)),
    },
  };
}
