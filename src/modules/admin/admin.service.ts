import { Injectable, Logger, BadRequestException, Inject } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { prisma } from '../../config/prisma';
import { randomUUID } from 'crypto';
import { AuditService, AuditActionType } from '../audit/audit.service';
import { hashPassword } from '../../config/argon2.config';
import speakeasy from 'speakeasy';
import type { RedisClientType } from 'redis';
import type { Invite, User } from '../../../generated/prisma/client';
import type { SpeakeasyTotpVerifyOptions, SpeakeasySecret } from 'speakeasy';
import { RequestWithSession } from '../../common/interfaces/request-with-session.interface';

const REDIS_PREFIX = 'admin_invite:';
const TTL_SECONDS = 60 * 15; // 15 minutes

interface SendInviteResult {
  inviteId: string;
  token: string;
}

interface MfaSecretResult {
  otpauth_url: string;
  base32: string;
}

interface CompleteInviteResult {
  id: string;
  name: string;
  email: string;
}

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly mailer: MailerService,
    private readonly config: ConfigService,
    private readonly auditService: AuditService,
    @Inject('REDIS_CLIENT') private readonly redis: RedisClientType,
  ) {}

  async sendInvite(
    email: string,
    senderId?: string | null,
    senderName?: string | null,
    senderEmail?: string | null,
  ): Promise<SendInviteResult> {
    const invite: Invite = await prisma.invite.create({
      data: {
        email,
        senderId: senderId ?? null,
        senderName: senderName ?? null,
        senderEmail: senderEmail ?? null,
      },
    });

    const token: string = randomUUID();
    await this.redis.setEx(`${REDIS_PREFIX}${token}`, TTL_SECONDS, invite.id);

    const appUrl: string = this.config.get('APP_URL') ?? 'http://localhost:5000';
    const acceptUrl: string = `${appUrl.replace(/\/$/, '')}/admin/invite/accept?token=${token}`;

    await this.mailer.sendMail({
      to: email,
      subject: 'Você recebeu um convite de admin',
      html: `<p>Você recebeu um convite para se tornar admin.</p>
      <p>Abra este link para aceitar (válido por 15 minutos):</p>
      <a href="${acceptUrl}">${acceptUrl}</a>`,
    });

    await this.auditService.record({
      action: AuditActionType.SYSTEM_CHANGE,
      actorId: senderId,
      actorName: senderName,
      actorEmail: senderEmail,
      targetType: 'invite',
      targetId: invite.id,
      description: `Invitation sent to ${email}`,
    });

    this.logger.log(`Invite sent to ${email} by ${senderEmail ?? 'unknown'}`);

    return { inviteId: invite.id, token };
  }

  async acceptInvite(
    token: string,
    name: string,
    password: string,
    req?: RequestWithSession,
  ): Promise<never> {
    throw new BadRequestException('Use MFA setup/complete endpoints to accept invites');
  }

  async generateMfaSecret(token: string): Promise<MfaSecretResult> {
    const key = `${REDIS_PREFIX}${token}`;
    const inviteId: string | null = await this.redis.get(key);
    if (!inviteId) throw new BadRequestException('Invalid or expired invite token');

    const secret: SpeakeasySecret = speakeasy.generateSecret({ length: 20, name: `blog-admin:${inviteId}` });
    await this.redis.setEx(`${REDIS_PREFIX}mfa:${token}`, TTL_SECONDS, secret.base32);

    return { otpauth_url: secret.otpauth_url, base32: secret.base32 };
  }

  async completeInvite(
    token: string,
    name: string,
    password: string,
    totp: string,
    req?: RequestWithSession,
  ): Promise<CompleteInviteResult> {
    const key = `${REDIS_PREFIX}${token}`;
    const inviteId: string | null = await this.redis.get(key);
    if (!inviteId) throw new BadRequestException('Invalid or expired invite token');

    const invite: Invite | null = await prisma.invite.findUnique({ where: { id: inviteId } });
    if (!invite) throw new BadRequestException('Invite not found');
    if (invite.acceptedAt) throw new BadRequestException('Invite already used');

    const mfaSecret: string | null = await this.redis.get(`${REDIS_PREFIX}mfa:${token}`);
    if (!mfaSecret) throw new BadRequestException('MFA not setup or expired');

    const verifyOptions: SpeakeasyTotpVerifyOptions = {
      secret: mfaSecret,
      encoding: 'base32',
      token: totp,
      window: 1,
    };
    const verified: boolean = speakeasy.totp.verify(verifyOptions);
    if (!verified) throw new BadRequestException('Invalid MFA code');

    const hashed: string = await hashPassword(password);

    const user: User = await prisma.user.create({
      data: {
        name,
        email: invite.email,
        password: hashed,
        role: 'admin',
        authenticationType: 'local',
        isEmailVerified: true,
        status: 'active',
      },
    });

    await prisma.invite.update({
      where: { id: inviteId },
      data: { acceptedAt: new Date(), status: 'ACCEPTED' },
    });

    await this.redis.del(key);
    await this.redis.del(`${REDIS_PREFIX}mfa:${token}`);

    await this.auditService.record({
      action: AuditActionType.ADMIN_ADD,
      actorId: invite.senderId ?? undefined,
      actorName: invite.senderName ?? undefined,
      actorEmail: invite.senderEmail ?? undefined,
      targetType: 'user',
      targetId: user.id,
      description: `Admin account created for ${invite.email} via invite ${invite.id}`,
    });

    this.logger.log(`Admin account created for ${invite.email} (id=${user.id})`);

    try {
      if (req?.session) {
        req.session.userId = user.id;
        req.session.role = 'admin';
        req.session.email = user.email;
        req.session.name = user.name;
      }
    } catch (err: unknown) {
      this.logger.error('Failed to create session after invite complete', err as Error);
    }

    return { id: user.id, name: user.name, email: user.email };
  }
}
