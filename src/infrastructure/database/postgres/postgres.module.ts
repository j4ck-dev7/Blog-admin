import { Module } from '@nestjs/common';
import { postgresProvider } from './postgres.provider';
import { PostgresService } from './postgres.service';

@Module({
  providers: [postgresProvider, PostgresService],
  exports: [postgresProvider, PostgresService],
})
export class PostgresModule {}
