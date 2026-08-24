import { Inject, Injectable } from '@nestjs/common';
import { Db, MongoClient } from 'mongodb';

@Injectable()
export class MongoDbService {
  constructor(@Inject('MONGO_CLIENT') private readonly client: MongoClient) {}

  database(name?: string): Db {
    return this.client.db(name);
  }
}
