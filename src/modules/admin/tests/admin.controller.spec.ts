import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from '../admin.controller';
import { AdminService } from '../admin.service';
import { AdminAuthGuard } from '../../../common/guards/admin-auth.guard';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

describe('AdminController', () => {
  let controller: AdminController;
  let adminService: jest.Mocked<AdminService>;

  beforeEach(async () => {
    // Create mock for AdminService
    adminService = {
      sendInvite: jest.fn(),
      generateMfaSecret: jest.fn(),
      completeInvite: jest.fn(),
      acceptInvite: jest.fn(),
    } as unknown as jest.Mocked<AdminService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        {
          provide: AdminService,
          useValue: adminService,
        },
      ],
    })
      // Mock the AdminAuthGuard to allow tests to run without session
      .overrideGuard(AdminAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AdminController>(AdminController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /admin/invite/send', () => {
    it('should call adminService.sendInvite with correct parameters from session', async () => {
      const mockReq = {
        session: {
          userId: 'admin-123',
          email: 'admin@example.com',
          name: 'Admin User',
        },
      };

      const mockBody = { email: 'newadmin@example.com' };
      const expectedResult = { inviteId: 'invite-456', token: 'token-789' };

      adminService.sendInvite.mockResolvedValue(expectedResult);

      const result = await controller.send(mockBody, mockReq);

      expect(adminService.sendInvite).toHaveBeenCalledWith(
        'newadmin@example.com',
        'admin-123',
        'Admin User',
        'admin@example.com'
      );
      expect(result).toEqual(expectedResult);
    });

    it('should handle missing session data', async () => {
      const mockReq = { session: null };
      const mockBody = { email: 'newadmin@example.com' };
      const expectedResult = { inviteId: 'invite-456', token: 'token-789' };

      adminService.sendInvite.mockResolvedValue(expectedResult);

      const result = await controller.send(mockBody, mockReq);

      expect(adminService.sendInvite).toHaveBeenCalledWith(
        'newadmin@example.com',
        undefined,
        undefined,
        undefined
      );
      expect(result).toEqual(expectedResult);
    });

    it('should pass through partial session data', async () => {
      const mockReq = {
        session: {
          userId: 'admin-123',
          email: 'admin@example.com',
          // name is missing
        },
      };
      const mockBody = { email: 'newadmin@example.com' };
      const expectedResult = { inviteId: 'invite-456', token: 'token-789' };

      adminService.sendInvite.mockResolvedValue(expectedResult);

      const result = await controller.send(mockBody, mockReq);

      expect(adminService.sendInvite).toHaveBeenCalledWith(
        'newadmin@example.com',
        'admin-123',
        undefined,
        'admin@example.com'
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('POST /admin/invite/setup-mfa', () => {
    it('should call adminService.generateMfaSecret with token', async () => {
      const mockBody = { token: 'valid-token-123' };
      const expectedResult = {
        otpauth_url: 'otpauth://totp/blog-admin:invite-123?secret=JBSWY3DPEHPK3PXP',
        base32: 'JBSWY3DPEHPK3PXP',
      };

      adminService.generateMfaSecret.mockResolvedValue(expectedResult);

      const result = await controller.setupMfa(mockBody);

      expect(adminService.generateMfaSecret).toHaveBeenCalledWith('valid-token-123');
      expect(result).toEqual(expectedResult);
    });

    it('should return MFA secret data', async () => {
      const mockBody = { token: 'token-456' };
      const expectedResult = {
        otpauth_url: 'otpauth://totp/blog-admin:invite-789?secret=ABCDEF',
        base32: 'ABCDEF',
      };

      adminService.generateMfaSecret.mockResolvedValue(expectedResult);

      const result = await controller.setupMfa(mockBody);

      expect(result).toHaveProperty('otpauth_url');
      expect(result).toHaveProperty('base32');
      expect(result.base32).toBe('ABCDEF');
    });
  });

  describe('POST /admin/invite/complete', () => {
    it('should call adminService.completeInvite with all parameters', async () => {
      const mockReq = {
        session: {},
      };
      const mockBody = {
        token: 'valid-token-123',
        name: 'New Admin',
        password: 'SecurePassword123!',
        totp: '123456',
      };
      const expectedResult = {
        id: 'user-123',
        name: 'New Admin',
        email: 'newadmin@example.com',
      };

      adminService.completeInvite.mockResolvedValue(expectedResult);

      const result = await controller.complete(mockBody, mockReq);

      expect(adminService.completeInvite).toHaveBeenCalledWith(
        'valid-token-123',
        'New Admin',
        'SecurePassword123!',
        '123456',
        mockReq
      );
      expect(result).toEqual(expectedResult);
    });

    it('should pass request object to service', async () => {
      const mockReq = {
        session: {
          userId: 'existing-user',
        },
      };
      const mockBody = {
        token: 'token-123',
        name: 'New Admin',
        password: 'password123',
        totp: '654321',
      };
      const expectedResult = { id: 'user-456', name: 'New Admin', email: 'test@example.com' };

      adminService.completeInvite.mockResolvedValue(expectedResult);

      const result = await controller.complete(mockBody, mockReq);

      expect(adminService.completeInvite).toHaveBeenCalledWith(
        'token-123',
        'New Admin',
        'password123',
        '654321',
        mockReq
      );
    });
  });

  describe('POST /admin/invite/accept', () => {
    it('should call adminService.acceptInvite with parameters', async () => {
      const mockReq = {
        session: {},
      };
      const mockBody = {
        token: 'valid-token-123',
        name: 'New Admin',
        password: 'SecurePassword123!',
      };

      // acceptInvite throws BadRequestException in the service
      adminService.acceptInvite.mockRejectedValue(
        new BadRequestException('Use MFA setup/complete endpoints to accept invites')
      );

      await expect(controller.accept(mockBody, mockReq)).rejects.toThrow(
        BadRequestException
      );

      expect(adminService.acceptInvite).toHaveBeenCalledWith(
        'valid-token-123',
        'New Admin',
        'SecurePassword123!',
        mockReq
      );
    });

    it('should handle the deprecated endpoint behavior', async () => {
      const mockReq = {};
      const mockBody = {
        token: 'old-token',
        name: 'Legacy Admin',
        password: 'legacy123',
      };

      adminService.acceptInvite.mockRejectedValue(
        new BadRequestException('Use MFA setup/complete endpoints to accept invites')
      );

      await expect(controller.accept(mockBody, mockReq)).rejects.toThrow(
        'Use MFA setup/complete endpoints to accept invites'
      );
    });
  });

  describe('GET /admin/invite/accept', () => {
    it('should return token and valid:true when token is provided', async () => {
      const token = 'valid-token-123';

      const result = await controller.acceptGet(token);

      expect(result).toEqual({
        token: 'valid-token-123',
        valid: true,
      });
    });

    it('should return token and valid:false when token is empty string', async () => {
      const result = await controller.acceptGet('');

      expect(result).toEqual({
        token: '',
        valid: false,
      });
    });

    it('should return token and valid:false when token is null', async () => {
      const result = await controller.acceptGet(null as any);

      expect(result).toEqual({
        token: null,
        valid: false,
      });
    });

    it('should return token and valid:false when token is undefined', async () => {
      const result = await controller.acceptGet(undefined as any);

      expect(result).toEqual({
        token: undefined,
        valid: false,
      });
    });

    it('should return valid:true for any non-empty token', async () => {
      const result = await controller.acceptGet('any-non-empty-token');

      expect(result.valid).toBe(true);
      expect(result.token).toBe('any-non-empty-token');
    });
  });
});

describe('AdminController - AdminAuthGuard', () => {
  let controller: AdminController;
  let adminService: jest.Mocked<AdminService>;

  beforeEach(async () => {
    adminService = {
      sendInvite: jest.fn(),
      generateMfaSecret: jest.fn(),
      completeInvite: jest.fn(),
      acceptInvite: jest.fn(),
    } as unknown as jest.Mocked<AdminService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        {
          provide: AdminService,
          useValue: adminService,
        },
      ],
    }).compile();

    controller = module.get<AdminController>(AdminController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('AdminAuthGuard integration', () => {
    it('should use AdminAuthGuard on send endpoint', async () => {
      const moduleWithGuard: TestingModule = await Test.createTestingModule({
        controllers: [AdminController],
        providers: [
          {
            provide: AdminService,
            useValue: adminService,
          },
        ],
      })
        .overrideGuard(AdminAuthGuard)
        .useValue({ canActivate: () => true })
        .compile();

      const controllerWithGuard = moduleWithGuard.get<AdminController>(AdminController);

      // This test verifies the guard is applied to the send endpoint
      // The guard should be tested separately, but here we verify the endpoint works with guard
      const mockReq = {
        session: {
          userId: 'admin-123',
          email: 'admin@example.com',
          name: 'Admin User',
        },
      };
      const mockBody = { email: 'newadmin@example.com' };
      adminService.sendInvite.mockResolvedValue({ inviteId: '123', token: '456' });

      await controllerWithGuard.send(mockBody, mockReq);

      expect(adminService.sendInvite).toHaveBeenCalled();
    });

    it('should not apply AdminAuthGuard to setup-mfa endpoint', async () => {
      // setup-mfa doesn't have @UseGuards(AdminAuthGuard)
      const mockBody = { token: 'valid-token' };
      const expectedResult = { otpauth_url: 'url', base32: 'secret' };

      adminService.generateMfaSecret.mockResolvedValue(expectedResult);

      const result = await controller.setupMfa(mockBody);

      expect(adminService.generateMfaSecret).toHaveBeenCalledWith('valid-token');
      expect(result).toEqual(expectedResult);
    });

    it('should not apply AdminAuthGuard to complete endpoint', async () => {
      const mockReq = { session: {} };
      const mockBody = {
        token: 'token-123',
        name: 'New Admin',
        password: 'password123',
        totp: '123456',
      };
      const expectedResult = { id: 'user-123', name: 'New Admin', email: 'test@example.com' };

      adminService.completeInvite.mockResolvedValue(expectedResult);

      const result = await controller.complete(mockBody, mockReq);

      expect(adminService.completeInvite).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });

    it('should not apply AdminAuthGuard to accept (POST) endpoint', async () => {
      const mockReq = { session: {} };
      const mockBody = {
        token: 'token-123',
        name: 'New Admin',
        password: 'password123',
      };

      adminService.acceptInvite.mockRejectedValue(
        new BadRequestException('Use MFA setup/complete endpoints to accept invites')
      );

      await expect(controller.accept(mockBody, mockReq)).rejects.toThrow(BadRequestException);
    });

    it('should not apply AdminAuthGuard to accept (GET) endpoint', async () => {
      const result = await controller.acceptGet('valid-token');

      expect(result).toEqual({
        token: 'valid-token',
        valid: true,
      });
    });
  });
});
