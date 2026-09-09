import { Invite } from '../../../../domain/entities/invite.entity';

export interface InviteRepositoryInterface {
  createInvite(
    email: string,
    senderId: string,
    senderEmail: string,
    senderName: string,
  ): Promise<void>;
  allInvites(): Promise<Invite[]>;
}
