export enum invite_status {
  pending = 'pending',
  active = 'active',
  blocked = 'blocked',
}

export interface Invite {
  id: string;
  email: string;
  sender_id: string;
  sender_email: string;
  sent_at: Date;
  accepted_at?: Date | null;
  status: invite_status;
  created_at: Date;
  updated_at?: Date | null;
}
