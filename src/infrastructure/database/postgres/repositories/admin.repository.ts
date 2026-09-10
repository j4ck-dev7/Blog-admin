import { Inject, Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { Admin, AdminWithRole } from '../../../../domain/entities/admin.entity';
import { IAdminRepository } from './admin.repository.interface';

@Injectable()
export class adminPostgresRepository implements IAdminRepository {
  private readonly logger = new Logger(adminPostgresRepository.name);
  constructor(@Inject('POSTGRES_POOL') private readonly pool: Pool) {}

  async findByEmail(email: string): Promise<Admin | null> {
    const client = await this.pool.connect();
    try {
      const query = await client.query(
        'SELECT id, password FROM "User" WHERE email = $1',
        [email],
      );

      if (query.rows.length === 0) {
        return null;
      }

      return {
        id: query.rows[0].id,
        password: query.rows[0].password,
      };
    } catch (error) {
      this.logger.error(`Error finding admin by email: ${email}`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  async findById(id: string): Promise<AdminWithRole | null> {
    const client = await this.pool.connect();
    try {
      const query = await client.query(
        'SELECT name, role, email FROM "User" WHERE id = $1',
        [id],
      );

      if (query.rows.length === 0) {
        return null;
      }

      return {
        name: query.rows[0].name,
        role: query.rows[0].role,
        email: query.rows[0].email,
      };
    } catch (error) {
      this.logger.error(`Error finding admin by id: ${id}`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  async createAdmin(data: {
    name: string;
    email: string;
    password: string;
    role: string;
  }): Promise<Admin | null> {
    const client = await this.pool.connect();
    try {
      const query = await client.query(
        'INSERT INTO "User" (name, email, password, role, "isEmailVerified", status, "createdAt") VALUES ($1, $2, $3, $4, true, $5, NOW()) RETURNING id, name, email, role',
        [data.name, data.email, data.password, data.role, 'active'],
      );

      if (query.rows.length === 0) {
        return null;
      }

      return {
        id: query.rows[0].id,
        name: query.rows[0].name,
        email: query.rows[0].email,
        role: query.rows[0].role,
      };
    } catch (error) {
      this.logger.error(`Error creating admin for email: ${data.email}`, error);
      throw error;
    } finally {
      client.release();
    }
  }
}
