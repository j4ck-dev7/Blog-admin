import { Injectable, Logger, BadRequestException, Inject } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { prisma } from '../../config/prisma';
import { randomUUID } from 'crypto';
import { AuditService, AuditActionType } from '../audit/audit.service';
import { hashPassword } from '../../config/argon2.config';
import speakeasy from 'speakeasy';
import type { RedisClientType } from 'redis';
import { AnyBulkWriteOperation } from 'mongoose';

const REDIS_PREFIX = 'admin_invite:';
const TTL_SECONDS = 60 * 15; // 15 minutes

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly mailer: MailerService,
    private readonly config: ConfigService,
    private readonly auditService: AuditService,
    @Inject('REDIS_CLIENT') private readonly redis: RedisClientType,
  ) {}

  async sendInvite(email: string, senderId?: string, senderName?: string, senderEmail?: string) {
    const invite = await prisma.invite.create({
      data: {
        email,
        senderId,
        senderName,
        senderEmail,
      },
    });

    const token = randomUUID();
    await this.redis.setEx(`${REDIS_PREFIX}${token}`, TTL_SECONDS, invite.id);

    const appUrl = this.config.get('APP_URL') ?? 'http://localhost:5000';
    const acceptUrl = `${appUrl.replace(/\/$/, '')}/admin/invite/accept?token=${token}`;

    // For production enforce https-only links. In development we allow http.
    // const acceptUrl = `https://${host}/admin/invite/accept?token=${token}`;

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

    return { inviteId: invite.id, token }; // token returned for testing; not stored in DB
  }

  async acceptInvite(token: string, name: string, password: string, req?: any) {
    // This method is superseded by separate MFA setup/complete flow
    throw new BadRequestException('Use MFA setup/complete endpoints to accept invites');
  }

  async generateMfaSecret(token: string) {
    const key = `${REDIS_PREFIX}${token}`;
    const inviteId = await this.redis.get(key);
    if (!inviteId) throw new BadRequestException('Invalid or expired invite token');

    const secret = speakeasy.generateSecret({ length: 20, name: `blog-admin:${inviteId}` });
    // store secret temporarily in redis for the token
    await this.redis.setEx(`${REDIS_PREFIX}mfa:${token}`, TTL_SECONDS, secret.base32);

    return { otpauth_url: secret.otpauth_url, base32: secret.base32 };
  }

  async completeInvite(token: string, name: string, password: string, totp: string, req?: any) {
    const key = `${REDIS_PREFIX}${token}`;
    const inviteId = await this.redis.get(key);
    if (!inviteId) throw new BadRequestException('Invalid or expired invite token');

    const invite = await prisma.invite.findUnique({ where: { id: inviteId } as any });
    if (!invite) throw new BadRequestException('Invite not found');
    if (invite.acceptedAt) throw new BadRequestException('Invite already used');

    const mfaSecret = await this.redis.get(`${REDIS_PREFIX}mfa:${token}`);
    if (!mfaSecret) throw new BadRequestException('MFA not setup or expired');

    const verified = speakeasy.totp.verify({ secret: mfaSecret, encoding: 'base32', token: totp, window: 1 } as any);
    if (!verified) throw new BadRequestException('Invalid MFA code');

    const hashed = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name,
        email: invite.email,
        password: hashed,
        role: 'admin',
        authenticationType: 'local',
        isEmailVerified: true,
        status: 'active',
        // mfaSecret field omitted – can be set later if needed
      },
    });

    await prisma.invite.update({ where: { id: inviteId } as any, data: { acceptedAt: new Date(), status: 'ACCEPTED' } });

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
      if (req && req.session) {
        req.session.userId = user.id;
        req.session.role = 'admin';
        req.session.email = user.email;
        req.session.name = user.name;
      }
    } catch (err) {
      this.logger.error('Failed to create session after invite complete', err);
    }

    return { id: user.id, name: user.name, email: user.email };
  }
}
