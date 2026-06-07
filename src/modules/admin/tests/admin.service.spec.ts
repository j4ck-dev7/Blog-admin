import { AdminService } from '../admin.service';
import { prisma } from '../../../config/prisma';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { AuditService } from '../../audit/audit.service';
import { BadRequestException } from '@nestjs/common';
import { beforeEach, afterEach, describe, expect, it, jest } from '@jest/globals';
import speakeasy from 'speakeasy';

describe('AdminService', () => {
  let adminService: AdminService;
  let mockMailer: Partial<MailerService>;
  let mockConfig: Partial<ConfigService>;
  let mockAudit: Partial<AuditService>;
  let mockRedis: any;

  beforeEach(() => {
    mockMailer = { sendMail: jest.fn() } as Partial<MailerService>;
    mockConfig = { get: jest.fn((key: string) => (key === 'APP_URL' ? 'http://localhost:5000' : undefined)) };
    mockAudit = { record: jest.fn() } as Partial<AuditService>;
    mockRedis = {
      get: jest.fn(),
      setEx: jest.fn(),
      del: jest.fn(),
    };

    adminService = new AdminService(
      mockMailer as MailerService,
      mockConfig as ConfigService,
      mockAudit as AuditService,
      mockRedis,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should send an invite and record audit', async () => {
    const invite = { id: 'invite-123', email: 'admin@example.com', senderId: 'sender-1' } as any;
    jest.spyOn(prisma.invite, 'create').mockResolvedValue(invite);

    const result = await adminService.sendInvite('admin@example.com', 'sender-1', 'Sender', 'sender@example.com');

    expect(mockMailer.sendMail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'admin@example.com',
      subject: 'Você recebeu um convite de admin',
    }));
    expect(mockRedis.setEx).toHaveBeenCalledWith(expect.any(String), 900, 'invite-123');
    expect(mockAudit.record).toHaveBeenCalledWith(expect.objectContaining({
      action: 'SYSTEM_CHANGE',
      actorId: 'sender-1',
      actorName: 'Sender',
      actorEmail: 'sender@example.com',
      targetType: 'invite',
      targetId: 'invite-123',
    }));
    expect(result).toHaveProperty('inviteId', 'invite-123');
    expect(result).toHaveProperty('token');
  });

  it('should generate MFA secret for valid invite token', async () => {
    mockRedis.get.mockResolvedValue('invite-123');

    const result = await adminService.generateMfaSecret('token-123');

    expect(result).toHaveProperty('otpauth_url');
    expect(result).toHaveProperty('base32');
    expect(mockRedis.setEx).toHaveBeenCalledWith('admin_invite:mfa:token-123', 900, result.base32);
  });

  it('should complete invite with valid TOTP code', async () => {
    const invite = { id: 'invite-123', email: 'admin@example.com', acceptedAt: null, senderId: 'sender-1', senderName: 'Sender', senderEmail: 'sender@example.com' } as any;
    mockRedis.get
      .mockResolvedValueOnce('invite-123')
      .mockResolvedValueOnce('JBSWY3DPEHPK3PXP');
    jest.spyOn(prisma.invite, 'findUnique').mockResolvedValue(invite);
    jest.spyOn(prisma.user, 'create').mockResolvedValue({ email: 'admin@example.com', id: 'user-1', name: 'newadmin' } as any);
    jest.spyOn(prisma.invite, 'update').mockResolvedValue({ ...invite, acceptedAt: new Date(), status: 'ACCEPTED' } as any);

    const totp = speakeasy.totp({ secret: 'JBSWY3DPEHPK3PXP', encoding: 'base32' });
    const req: any = { session: {} };

    const result = await adminService.completeInvite('token-123', 'newadmin', 'Password123!', totp, req);

    expect(result).toMatchObject({ email: 'admin@example.com', id: 'user-1', name: 'newadmin' });
    expect(req.session).toMatchObject({ userId: 'user-1', role: 'admin', email: 'admin@example.com', name: 'newadmin' });
    expect(mockRedis.del).toHaveBeenCalledWith('admin_invite:token-123');
    expect(mockRedis.del).toHaveBeenCalledWith('admin_invite:mfa:token-123');
    expect(mockAudit.record).toHaveBeenCalledWith(expect.objectContaining({
      action: 'ADMIN_ADD',
      targetType: 'user',
      targetId: 'user-1',
      description: expect.stringContaining('Admin account created for admin@example.com'),
    }));
  });

  it('should reject invalid invite token when generating MFA secret', async () => {
    mockRedis.get.mockResolvedValue(null);
    await expect(adminService.generateMfaSecret('bad-token')).rejects.toThrow(BadRequestException);
  });
});
