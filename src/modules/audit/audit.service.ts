import { Injectable } from '@nestjs/common';
import { AuditRepository } from '../../infrastructure/database/postgres/repositories/audit.repository';
import {
  AuditRecordPayload,
  AuditRecords,
} from '../../domain/entities/audit.entity';
import { adminPostgresRepository } from '../../infrastructure/database/postgres/repositories/admin.repository';
import { AuditActionType } from '../../domain/entities/audit.entity';

@Injectable()
export class AuditService {
  constructor(
    private readonly auditRepository: AuditRepository,
    private readonly adminRepository: adminPostgresRepository,
  ) {
    this.auditRepository = auditRepository;
    this.adminRepository = adminRepository;
  }

  async record(
    id: string | null | undefined,
    action: AuditActionType,
    description: string,
  ): Promise<void> {
    if (!id) {
      const payload: AuditRecordPayload = {
        action,
        actorId: null,
        actorName: null,
        actorEmail: null,
        actorRole: null,
        description,
        createdAt: new Date(),
      };

      await this.auditRepository.createAudit(payload);
      return;
    }

    const admin = await this.adminRepository.findById(id);

    const payload: AuditRecordPayload = {
      action,
      actorId: id,
      actorName: admin?.name ?? null,
      actorEmail: admin?.email ?? null,
      actorRole: admin?.role ?? null,
      description,
      createdAt: new Date(),
    };

    await this.auditRepository.createAudit(payload);
  }

  async allRecords(): Promise<AuditRecords[]> {
    const records = await this.auditRepository.allAudits();
    return records;
  }
}
