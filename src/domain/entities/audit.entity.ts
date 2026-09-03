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
  description?: string | null;
  createdAt?: Date | null;
}

export interface AuditRecords {
  id: string;
  action: AuditActionType;
  actorId?: string | null;
  actorName?: string | null;
  actorEmail?: string | null;
  actorRole?: string | null;
  description?: string | null;
  createdAt?: Date | null;
}
