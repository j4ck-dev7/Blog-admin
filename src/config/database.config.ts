import { ConfigService } from '@nestjs/config';
import { MongoClient } from 'mongodb';
import { Pool } from 'pg';

export const databaseProviders = [
    {
        provide: 'POSTGRES_POOL',
        useFactory: (configService: ConfigService) => {
            return new Pool({
                database: 'postgres',
                user: configService.get<string>('POSTGRES_USER'),
                password: configService.get<string>('POSTGRES_PASSWORD'),
                port: 5432,
                ssl: true,
                max: 20,
                idleTimeoutMillis: 5000,
                connectionTimeoutMillis: 5000,
                maxUses: 20
            })
        },
        inject: [ConfigService]
    },
    {
        provide: 'MONGO_CLIENT',
        useFactory: async (configService: ConfigService) => {
            const client = new MongoClient(configService.get<string>('MONGO_URI'));
            await client.connect();
            return client;
        },
        inject: [ConfigService]
    }
]