import {
  Injectable,
  Logger,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { OTP } from 'otplib';
import { AuditService } from '../audit/audit.service';
import { hashPassword } from '../../config/argon2.config';
import type { RedisClientType } from 'redis';
import { RequestWithSession } from '../../common/interfaces/request-with-session.interface';
import { AuditActionType } from '../../domain/entities/audit.entity';
import { InviteRepository } from '../../infrastructure/database/postgres/repositories/invite.repository';
import { adminPostgresRepository } from '../../infrastructure/database/postgres/repositories/admin.repository';
import { Invite } from '../../domain/entities/invite.entity';

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
    private readonly inviteRepository: InviteRepository,
    private readonly adminRepository: adminPostgresRepository,
    @Inject('REDIS_CLIENT') private readonly redis: RedisClientType,
  ) {}

  async sendInvite(
    email: string,
    senderId?: string | null,
    senderName?: string | null,
    senderEmail?: string | null,
  ): Promise<SendInviteResult> {
    const invite: Invite = await this.inviteRepository.createInvite(
      email,
      senderId,
      senderName,
      senderEmail,
    );

    const token: string = randomUUID();
    await this.redis.setEx(`${REDIS_PREFIX}${token}`, TTL_SECONDS, invite.id);

    const appUrl: string =
      this.config.get('APP_URL') ?? 'http://localhost:5000';
    const acceptUrl: string = `${appUrl.replace(/\/$/, '')}/admin/invite/accept?token=${token}`;

    await this.mailer.sendMail({
      to: email,
      subject: 'Você recebeu um convite de admin',
      html: `<p>Você recebeu um convite para se tornar admin.</p>
      <p>Abra este link para aceitar (válido por 15 minutos):</p>
      <a href="${acceptUrl}">${acceptUrl}</a>`,
    });

    await this.auditService.record(
      senderId,
      AuditActionType.SYSTEM_CHANGE,
      `Invitation sent to ${email}`,
    );

    this.logger.log(`Invite sent to ${email} by ${senderEmail ?? 'unknown'}`);

    return { inviteId: invite.id, token };
  }

  async acceptInvite(
    token: string,
    name: string,
    password: string,
    req?: RequestWithSession,
  ): Promise<never> {
    throw new BadRequestException(
      'Use MFA setup/complete endpoints to accept invites',
    );
  }

  async generateMfaSecret(token: string): Promise<MfaSecretResult> {
    const key = `${REDIS_PREFIX}${token}`;
    const inviteId = (await this.redis.get(key)) as string | null;
    if (!inviteId) {
      throw new BadRequestException('Invalid or expired invite token');
    }

    const otp = new OTP();
    const secret = otp.generateSecret();
    const otpauthUrl = otp.generateURI({
      issuer: 'blog-admin',
      label: `admin:${inviteId}`,
      secret,
    });

    await this.redis.setEx(`${REDIS_PREFIX}mfa:${token}`, TTL_SECONDS, secret);

    return { otpauth_url: otpauthUrl, base32: secret };
  }

  async completeInvite(
    token: string,
    name: string,
    password: string,
    totp: string,
    req?: RequestWithSession,
  ): Promise<CompleteInviteResult> {
    const key = `${REDIS_PREFIX}${token}`;
    const inviteId = (await this.redis.get(key)) as string | null;
    if (!inviteId)
      throw new BadRequestException('Invalid or expired invite token');

    const invite: Invite | null = await this.inviteRepository.findById(inviteId);
    if (!invite) throw new BadRequestException('Invite not found');
    if (invite.acceptedAt) throw new BadRequestException('Invite already used');

    const mfaSecret = (await this.redis.get(`${REDIS_PREFIX}mfa:${token}`)) as
      string | null;
    if (!mfaSecret) throw new BadRequestException('MFA not setup or expired');

    const otp = new OTP();
    const result = await otp.verify({
      token: totp,
      secret: mfaSecret,
    });
    if (!result.valid) throw new BadRequestException('Invalid MFA code');

    const hashed: string = await hashPassword(password);

    const createdUser = await this.adminRepository.createAdmin({
      name,
      email: invite.email ?? '',
      password: hashed,
      role: 'admin',
    });

    if (!createdUser?.id) {
      throw new BadRequestException('Failed to create admin account');
    }

    await this.inviteRepository.markAccepted(inviteId);

    await this.redis.del(key);
    await this.redis.del(`${REDIS_PREFIX}mfa:${token}`);

    await this.auditService.record(
      invite.senderId ?? null,
      AuditActionType.ADMIN_ADD,
      `Admin account created for ${invite.email} via invite ${invite.id}`,
    );

    this.logger.log(
      `Admin account created for ${invite.email} (id=${createdUser.id})`,
    );

    try {
      if (req?.session) {
        req.session.userId = createdUser.id;
        req.session.role = 'admin';
        req.session.email = createdUser.email ?? invite.email ?? '';
        req.session.name = createdUser.name ?? name;
      }
    } catch (err: unknown) {
      this.logger.error(
        'Failed to create session after invite complete',
        err as Error,
      );
    }

    return {
      id: createdUser.id,
      name: createdUser.name ?? name,
      email: createdUser.email ?? invite.email ?? '',
    };
  }
}
