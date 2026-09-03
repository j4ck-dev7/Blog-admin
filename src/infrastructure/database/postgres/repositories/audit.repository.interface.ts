import { AuditRecordPayload } from '../../../../domain/entities/audit.entity';

export interface AuditRepositoryInterface {
  createAudit(payload: AuditRecordPayload): Promise<void>;
  allAudits(): Promise<AuditRecordPayload[]>;
}
