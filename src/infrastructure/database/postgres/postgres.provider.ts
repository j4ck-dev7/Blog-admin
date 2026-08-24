import { databaseProviders } from '../database.config';

export const postgresProvider = databaseProviders.find(
  (provider) => provider.provide === 'POSTGRES_POOL',
)!;
