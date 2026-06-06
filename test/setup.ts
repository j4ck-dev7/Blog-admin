import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongooseModule } from '@nestjs/mongoose';

let mongod: MongoMemoryServer;

export async function startInMemoryMongo() {
  mongod = await MongoMemoryServer.create();
  const mongoUri = mongod.getUri();
  process.env.MONGO_CONNECT = mongoUri;
  return mongoUri;
}

export async function stopInMemoryMongo() {
  if (mongod) {
    await mongod.stop();
  }
}

export function getMongooseTestModule() {
  return MongooseModule.forRoot(process.env.MONGO_CONNECT!);
}