import { Injectable } from '@nestjs/common';
import { AuditRepository } from './audit.repository';

export enum AuditActionType {
  ADMIN_ADD = 'ADMIN_ADD',
  ADMIN_UPDATE = 'ADMIN_UPDATE',
  ADMIN_DELETE = 'ADMIN_DELETE',
  ADMIN_LOGIN = 'ADMIN_LOGIN',
  ADMIN_LOGOUT = 'ADMIN_LOGOUT',
  SYSTEM_CHANGE = 'SYSTEM_CHANGE',
}

export interface AuditRecordPayload {
  action: AuditActionType;
  actorId?: string | null;
  actorName?: string | null;
  actorEmail?: string | null;
  actorRole?: string | null;
  targetType?: string | null;
  targetId?: string | null;
  description?: string | null;
  metadata?: unknown;
}

@Injectable()
export class AuditService {
  constructor(private readonly auditRepository: AuditRepository) {}

  async record(payload: AuditRecordPayload) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.auditRepository.createAudit({
      action: payload.action,
      actorId: payload.actorId,
      actorName: payload.actorName,
      actorEmail: payload.actorEmail,
      actorRole: payload.actorRole as any,
      targetType: payload.targetType,
      targetId: payload.targetId,
      description: payload.description,
      metadata: payload.metadata as any,
      createdAt: new Date(),
    } as any);
  }

  async listRecent(limit = 50) {
    return this.auditRepository.getRecentAudits(limit);
  }
}
