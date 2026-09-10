import { Invite } from '../../../../domain/entities/invite.entity';

export interface InviteRepositoryInterface {
  createInvite(
    email: string,
    senderId?: string | null,
    senderEmail?: string | null,
    senderName?: string | null,
  ): Promise<Invite>;
  findById(id: string): Promise<Invite | null>;
  markAccepted(id: string): Promise<void>;
  allInvites(): Promise<Invite[]>;
}
