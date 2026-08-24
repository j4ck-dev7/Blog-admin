import { Inject, Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { Admin } from '../../../../domain/entities/admin.entity';
import { IAdminRepository } from './admin.repository.interface';

@Injectable()
export class adminPostgresRepository implements IAdminRepository {
  private readonly logger = new Logger(adminPostgresRepository.name);
  constructor(@Inject('POSTGRES_POOL') private readonly pool: Pool) {}

  // test code
  async findById(id: string): Promise<Admin | null> {
    this.logger.log(`Finding admin by id: ${id}`);
    const client = await this.pool.connect();
    try {
      const query = await client.query('SELECT id FROM User WHERE id = $1', [
        id,
      ]);

      this.logger.log(
        `Found admin by id: ${id}, result: ${JSON.stringify(query.rows)}`,
      );
      return query.rows.length > 0 ? { id: query.rows[0].id } : null;
    } catch (error) {
      this.logger.error(`Error finding admin by id: ${id}`, error);
      client.release();
      throw error;
    }
  }
}
