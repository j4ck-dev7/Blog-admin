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
    id: string,
    action: AuditActionType,
    description: string,
  ): Promise<void> {
    const admin = await this.adminRepository.findById(id);

    const payload: AuditRecordPayload = {
      action,
      actorId: id,
      actorName: admin.name,
      actorEmail: admin.email,
      actorRole: admin.role,
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
