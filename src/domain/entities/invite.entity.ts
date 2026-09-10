export enum invite_status {
  pending = 'pending',
  active = 'active',
  blocked = 'blocked',
}

export interface Invite {
  id?: string;
  email?: string;
  senderId?: string;
  senderEmail?: string;
  senderName?: string;
  sentAt?: Date;
  acceptedAt?: Date | null;
  status?: invite_status;
  createdAt?: Date;
  updatedAt?: Date | null;
}
