import { Inject, Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import {
  AuditRecordPayload,
  AuditRecords,
} from '../../../../domain/entities/audit.entity';
import { AuditRepositoryInterface } from './audit.repository.interface';

@Injectable()
export class AuditRepository implements AuditRepositoryInterface {
  private readonly logger = new Logger(AuditRepository.name);
  constructor(@Inject('POSTGRES_POOL') private readonly pool: Pool) {}

  async createAudit(payload: AuditRecordPayload): Promise<void> {
    const client = await this.pool.connect();

    try {
      await client.query(
        'INSERT INTO "Audit" (action, actor_id, actor_name, actor_email, actor_role, description, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
        [
          payload.action,
          payload.actorId,
          payload.actorName,
          payload.actorEmail,
          payload.actorRole,
          payload.description,
          payload.createdAt,
        ],
      );
      this.logger.log('Audit record created successfully');
    } catch (error) {
      this.logger.error('Error creating audit record', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async allAudits(): Promise<AuditRecords[]> {
    const client = await this.pool.connect();

    try {
      const query = await client.query(
        'SELECT * FROM "Audit" ORDER BY created_at DESC',
      );
      return query.rows.map((row) => ({
        id: row.id,
        action: row.action,
        actorId: row.actor_id,
        actorName: row.actor_name,
        actorEmail: row.actor_email,
        actorRole: row.actor_role,
        description: row.description,
        createdAt: row.created_at,
      }));
    } catch (error) {
      this.logger.error('Error fetching audit records', error);
      throw error;
    } finally {
      client.release();
    }
  }
}
