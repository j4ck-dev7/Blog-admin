import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { MongoClient } from 'mongodb';
import { Pool } from 'pg';

export const databaseProviders = [
  {
    provide: 'POSTGRES_POOL',
    useFactory: (configService: ConfigService) => {
      const pool = new Pool({
        database: configService.get<string>('POSTGRES_DB'),
        user: configService.get<string>('POSTGRES_USER'),
        password: configService.get<string>('POSTGRES_PASSWORD'),
        port: 5432,
        ssl: true,
        max: 20,
        idleTimeoutMillis: 5000,
        connectionTimeoutMillis: 5000,
        maxUses: 20,
      });

      pool.on('connect', () => {
        Logger.log('Connected to PostgreSQL database');
      });

      pool.on('error', (err) => {
        Logger.error('Error connecting to PostgreSQL database', err);
      });

      return pool;
    },
    inject: [ConfigService],
  },
  {
    provide: 'MONGO_CLIENT',
    useFactory: async (configService: ConfigService) => {
      const client = new MongoClient(
        configService.get<string>('MONGO_CONNECT'),
      );
      await client.connect();
      return client;
    },
    inject: [ConfigService],
  },
];
