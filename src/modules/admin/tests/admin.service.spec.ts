import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

jest.mock('otplib', () => ({
  OTP: class {
    generateSecret = jest.fn(() => 'BASE32SECRET');
    generateURI = jest.fn(
      () => 'otpauth://totp/blog-admin?secret=BASE32SECRET',
    );
    verify = jest.fn(async () => ({ valid: true }));
  },
}));

import { AdminService } from '../admin.service';
import { hashPassword } from '../../../config/argon2.config';

jest.mock('crypto', () => ({
  randomUUID: jest.fn(() => 'mocked-token'),
}));

jest.mock('../../../config/argon2.config', () => ({
  hashPassword: jest.fn(),
}));

describe('AdminService', () => {
  let service: AdminService;
  let mailer: any;
  let config: any;
  let auditService: any;
  let inviteRepository: any;
  let adminRepository: any;
  let redis: any;

  beforeEach(() => {
    mailer = {
      sendMail: jest.fn(async () => undefined),
    };

    config = {
      get: jest.fn((key: string) => {
        if (key === 'APP_URL') return 'http://localhost:5000';
        return undefined;
      }),
    };

    auditService = {
      record: jest.fn(async () => undefined),
    };

    inviteRepository = {
      createInvite: jest.fn(),
      findById: jest.fn(),
      markAccepted: jest.fn(async () => undefined),
    };

    adminRepository = {
      createAdmin: jest.fn(),
    };

    redis = {
      get: jest.fn(),
      setEx: jest.fn(async () => 'OK'),
      del: jest.fn(async () => 1),
    };

    service = new AdminService(
      mailer,
      config,
      auditService,
      inviteRepository,
      adminRepository,
      redis,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('sendInvite creates the invite with sender data, stores the token and emails the invite', async () => {
    inviteRepository.createInvite.mockResolvedValue({ id: 'invite-123' });

    const result = await service.sendInvite(
      'new-admin@test.com',
      'sender-1',
      'Sender Name',
      'sender@test.com',
    );

    expect(inviteRepository.createInvite).toHaveBeenCalledWith(
      'new-admin@test.com',
      'sender-1',
      'Sender Name',
      'sender@test.com',
    );
    expect(redis.setEx).toHaveBeenCalledWith(
      'admin_invite:mocked-token',
      900,
      'invite-123',
    );
    expect(mailer.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'new-admin@test.com',
        subject: 'Você recebeu um convite de admin',
        html: expect.stringContaining(
          'http://localhost:5000/admin/invite/accept?token=mocked-token',
        ),
      }),
    );
    expect(auditService.record).toHaveBeenCalledWith(
      'sender-1',
      'SYSTEM_CHANGE',
      'Invitation sent to new-admin@test.com',
    );
    expect(result).toEqual({ inviteId: 'invite-123', token: 'mocked-token' });
  });

  it('generateMfaSecret validates the invite and stores the generated TOTP secret', async () => {
    redis.get.mockResolvedValue('invite-123');

    const result = await service.generateMfaSecret('invite-token');

    expect(redis.get).toHaveBeenCalledWith('admin_invite:invite-token');
    expect(redis.setEx).toHaveBeenCalledWith(
      'admin_invite:mfa:invite-token',
      900,
      expect.any(String),
    );
    expect(result).toEqual(
      expect.objectContaining({
        base32: expect.any(String),
        otpauth_url: expect.stringContaining('otpauth://'),
      }),
    );
  });

  it('completeInvite creates the admin, marks invite as accepted and records audit info', async () => {
    redis.get.mockImplementation(async (key: string) => {
      if (key === 'admin_invite:invite-token') return 'invite-123';
      if (key === 'admin_invite:mfa:invite-token') return 'JBSWY3DPEHPK3PXP';
      return null;
    });

    inviteRepository.findById.mockResolvedValue({
      id: 'invite-123',
      email: 'new-admin@test.com',
      senderId: 'sender-1',
      senderEmail: 'sender@test.com',
      senderName: 'Sender Name',
      acceptedAt: null,
    });

    adminRepository.createAdmin.mockResolvedValue({
      id: 'admin-user-1',
      name: 'New Admin',
      email: 'new-admin@test.com',
      role: 'admin',
    });

    (hashPassword as any).mockResolvedValue('hashed-password');

    const result = await service.completeInvite(
      'invite-token',
      'New Admin',
      'Password123',
      '123456',
      { session: { userId: 'session-user' } } as any,
    );

    expect(inviteRepository.findById).toHaveBeenCalledWith('invite-123');
    expect(hashPassword).toHaveBeenCalledWith('Password123');
    expect(adminRepository.createAdmin).toHaveBeenCalledWith({
      name: 'New Admin',
      email: 'new-admin@test.com',
      password: 'hashed-password',
      role: 'admin',
    });
    expect(inviteRepository.markAccepted).toHaveBeenCalledWith('invite-123');
    expect(auditService.record).toHaveBeenCalledWith(
      'sender-1',
      'ADMIN_ADD',
      'Admin account created for new-admin@test.com via invite invite-123',
    );
    expect(redis.del).toHaveBeenCalledWith('admin_invite:invite-token');
    expect(redis.del).toHaveBeenCalledWith('admin_invite:mfa:invite-token');
    expect(result).toEqual({
      id: 'admin-user-1',
      name: 'New Admin',
      email: 'new-admin@test.com',
    });
  });
});
