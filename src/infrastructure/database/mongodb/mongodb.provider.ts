import { databaseProviders } from '../database.config';

export const mongoProvider = databaseProviders.find(
  (provider) => provider.provide === 'MONGO_CLIENT',
)!;
