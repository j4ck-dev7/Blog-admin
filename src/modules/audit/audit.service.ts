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
  actorId?: string;
  actorName?: string;
  actorEmail?: string;
  actorRole?: string;
  targetType?: string;
  targetId?: string;
  description?: string;
  metadata?: unknown;
}

@Injectable()
export class AuditService {
  constructor(private readonly auditRepository: AuditRepository) {}

  async record(payload: AuditRecordPayload) {
    return this.auditRepository.createAudit({
      ...payload,
      createdAt: new Date(),
    });
  }

  async listRecent(limit = 50) {
    return this.auditRepository.getRecentAudits(limit);
  }
}
