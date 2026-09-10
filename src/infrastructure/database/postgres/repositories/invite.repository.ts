import { Inject, Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import {
  Invite,
  invite_status,
} from '../../../../domain/entities/invite.entity';
import { InviteRepositoryInterface } from './invite.repository.interface';

@Injectable()
export class InviteRepository implements InviteRepositoryInterface {
  private readonly logger = new Logger(InviteRepository.name);
  constructor(@Inject('POSTGRES_POOL') private readonly pool: Pool) {}

  async createInvite(
    email: string,
    senderId?: string | null,
    senderEmail?: string | null,
    senderName?: string | null,
  ): Promise<Invite> {
    const client = await this.pool.connect();

    try {
      const query = await client.query(
        'INSERT INTO "Invite" (email, sender_id, sender_email, sender_name, sent_at, status, created_at) VALUES ($1, $2, $3, $4, NOW(), $5, NOW()) RETURNING id, email, sender_id, sender_email, sender_name, sent_at, status, created_at',
        [email, senderId, senderEmail, senderName, invite_status.pending],
      );

      this.logger.log('Invite created successfully');
      const row = query.rows[0];
      return {
        id: row.id,
        email: row.email,
        senderId: row.sender_id,
        senderEmail: row.sender_email,
        senderName: row.sender_name,
        sentAt: row.sent_at,
        status: row.status,
        createdAt: row.created_at,
      };
    } catch (error) {
      this.logger.error('Error creating invite');
      throw error;
    } finally {
      client.release();
    }
  }

  async findById(id: string): Promise<Invite | null> {
    const client = await this.pool.connect();
    try {
      const query = await client.query(
        'SELECT * FROM "Invite" WHERE id = $1',
        [id],
      );

      if (query.rows.length === 0) {
        return null;
      }

      const row = query.rows[0];
      return {
        id: row.id,
        email: row.email,
        senderId: row.sender_id,
        senderEmail: row.sender_email,
        senderName: row.sender_name,
        sentAt: row.sent_at,
        acceptedAt: row.accepted_at,
        status: row.status,
        createdAt: row.created_at,
      };
    } catch (error) {
      this.logger.error(`Error fetching invite by id: ${id}`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  async markAccepted(id: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(
        'UPDATE "Invite" SET accepted_at = NOW(), status = $2, updated_at = NOW() WHERE id = $1',
        [id, 'ACCEPTED'],
      );
    } catch (error) {
      this.logger.error(`Error accepting invite id: ${id}`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  async allInvites(): Promise<Invite[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM "Invite" ORDER BY created_at DESC',
      );

      return result.rows.map((row) => ({
        id: row.id,
        email: row.email,
        senderId: row.sender_id,
        senderEmail: row.sender_email,
        senderName: row.sender_name,
        sentAt: row.sent_at,
        status: row.status,
        createdAt: row.created_at,
      }));
    } catch (error) {
      this.logger.error('Error fetching invites');
      throw error;
    } finally {
      client.release();
    }
  }
}
