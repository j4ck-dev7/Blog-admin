import { Inject, Injectable } from '@nestjs/common';
import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

@Injectable()
export class PostgresService {
  constructor(@Inject('POSTGRES_POOL') private readonly pool: Pool) {}

  query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    values?: unknown[],
  ): Promise<QueryResult<T>> {
    return this.pool.query<T>(text, values);
  }

  connect(): Promise<PoolClient> {
    return this.pool.connect();
  }
}
