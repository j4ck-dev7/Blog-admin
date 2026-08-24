import { Module } from '@nestjs/common';
import { mongoProvider } from './mongodb.provider';
import { MongoDbService } from './mongodb.service';

@Module({
  providers: [mongoProvider, MongoDbService],
  exports: [mongoProvider, MongoDbService],
})
export class MongoDbModule {}
