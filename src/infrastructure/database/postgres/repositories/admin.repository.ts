import { Inject, Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { Admin } from '../../../../domain/entities/admin.entity';
import { IAdminRepository } from './admin.repository.interface';

@Injectable()
export class adminPostgresRepository implements IAdminRepository {
  private readonly logger = new Logger(adminPostgresRepository.name);
  constructor(@Inject('POSTGRES_POOL') private readonly pool: Pool) {}

  async findByEmail(email: string): Promise<Admin | null> {
    const client = await this.pool.connect();
    try {
      const query = await client.query(
        'SELECT id, password, role FROM "User" WHERE email = $1',
        [email],
      );

      if (query.rows.length === 0) {
        return null;
      }

      return {
        id: query.rows[0].id,
        password: query.rows[0].password,
        role: query.rows[0].role,
      };
    } catch (error) {
      this.logger.error(`Error finding admin by email: ${email}`, error);
      throw error;
    } finally {
      client.release();
    }
  }
}
