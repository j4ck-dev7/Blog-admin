import { Module } from '@nestjs/common';
import { databaseProviders } from '../../../config/database.config';

@Module({
  providers: [
    ...databaseProviders.filter((p) => p.provide.includes('MONGO_CLIENT')),
  ],
  exports: ['MONGO_CLIENT'],
})
export class MongoDbModule {}
