import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

jest.mock('isomorphic-dompurify', () => ({
  sanitize: jest.fn((value) => value),
}));

jest.mock('../admin.service', () => ({
  AdminService: class {},
}));

import { AdminController } from '../admin.controller';

describe('AdminController', () => {
  let controller: AdminController;
  let mockAdminService: any;

  beforeEach(() => {
    mockAdminService = {
      sendInvite: jest.fn(),
      generateMfaSecret: jest.fn(),
      completeInvite: jest.fn(),
      acceptInvite: jest.fn(),
    };

    controller = new AdminController(mockAdminService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('send delegates to adminService.sendInvite with session information', async () => {
    const result = { inviteId: 'invite-1', token: 'token-1' };
    const req = {
      session: {
        userId: 'user-1',
        email: 'sender@test.com',
        name: 'Sender User',
      },
    } as any;

    mockAdminService.sendInvite.mockResolvedValue(result);

    const response = await controller.send(
      { email: 'new-admin@test.com' } as any,
      req,
    );

    expect(mockAdminService.sendInvite).toHaveBeenCalledWith(
      'new-admin@test.com',
      'user-1',
      'Sender User',
      'sender@test.com',
    );
    expect(response).toEqual(result);
  });

  it('setupMfa delegates to adminService.generateMfaSecret', async () => {
    const result = { otpauth_url: 'otpauth://test', base32: 'SECRET' };
    mockAdminService.generateMfaSecret.mockResolvedValue(result);

    const response = await controller.setupMfa({
      token: 'invite-token',
    } as any);

    expect(mockAdminService.generateMfaSecret).toHaveBeenCalledWith(
      'invite-token',
    );
    expect(response).toEqual(result);
  });

  it('complete delegates to adminService.completeInvite with request object', async () => {
    const result = { id: 'user-1', name: 'Admin', email: 'admin@test.com' };
    const req = { session: { userId: 'user-1' } } as any;
    mockAdminService.completeInvite.mockResolvedValue(result);

    const response = await controller.complete(
      {
        token: 'invite-token',
        name: 'Admin',
        password: 'pass123',
        totp: '123456',
      } as any,
      req,
    );

    expect(mockAdminService.completeInvite).toHaveBeenCalledWith(
      'invite-token',
      'Admin',
      'pass123',
      '123456',
      req,
    );
    expect(response).toEqual(result);
  });

  it('accept delegates to adminService.acceptInvite', async () => {
    const result = { success: true };
    const req = { session: { userId: 'user-1' } } as any;
    mockAdminService.acceptInvite.mockResolvedValue(result);

    const response = await controller.accept(
      {
        token: 'invite-token',
        name: 'Admin',
        password: 'pass123',
      } as any,
      req,
    );

    expect(mockAdminService.acceptInvite).toHaveBeenCalledWith(
      'invite-token',
      'Admin',
      'pass123',
      req,
    );
    expect(response).toEqual(result);
  });

  it('acceptGet returns the token and validity flag', async () => {
    const response = await controller.acceptGet('invite-token');

    expect(response).toEqual({ token: 'invite-token', valid: true });
  });
});
