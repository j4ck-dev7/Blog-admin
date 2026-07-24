import { Module } from '@nestjs/common';
import { databaseProviders } from '../database.config';

@Module({
  providers: [
    ...databaseProviders.filter((p) => p.provide.includes('POSTGRES_POOL')),
  ],
  exports: ['POSTGRES_POOL'],
})
export class PostgresModule {}
