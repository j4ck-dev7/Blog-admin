import { AuthService } from '../auth.service';
import { prisma } from '../../../config/prisma';
import { beforeEach, afterEach, describe, expect, it, jest } from '@jest/globals';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let mockTokenService: any;

  beforeEach(() => {
    mockTokenService = {
      generatePair: jest.fn(),
      validateRefreshToken: jest.fn(),
      revokeRefreshByJti: jest.fn(),
    };

    service = new AuthService(mockTokenService as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('validateUserByEmail returns null when not found', async () => {
    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);
    const res = await service.validateUserByEmail('no@one.com', 'x');
    expect(res).toBeNull();
  });

  it('login throws BadRequestException when missing credentials', async () => {
    await expect(service.login(null as any, null as any)).rejects.toThrow(BadRequestException);
  });

  it('login throws UnauthorizedException for invalid credentials', async () => {
    jest.spyOn(service, 'validateUserByEmail').mockImplementation(() => Promise.resolve(null));
    await expect(service.login('a@b.com', 'pw')).rejects.toThrow(UnauthorizedException);
  });

  it('login returns tokens and user on success', async () => {
    const user = { id: 'u1', email: 'a@b.com', name: 'Name', role: 'admin' } as any;
    jest.spyOn(service, 'validateUserByEmail').mockImplementation(() => Promise.resolve(user));
    mockTokenService.generatePair.mockImplementation(() => Promise.resolve({ accessToken: 'a', refreshToken: 'r', jti: 'j' }));

    const res = await service.login('a@b.com', 'pw');
    expect(mockTokenService.generatePair).toHaveBeenCalledWith('u1', 'admin');
    expect(res).toEqual(expect.objectContaining({ accessToken: 'a', refreshToken: 'r', user: { id: 'u1', email: 'a@b.com', name: 'Name', role: 'admin' } }));
  });

  it('logout returns success true when token invalid', async () => {
    mockTokenService.validateRefreshToken.mockImplementation(() => Promise.resolve(null));
    const res = await service.logout('badtoken');
    expect(res).toEqual({ success: true });
    expect(mockTokenService.revokeRefreshByJti).not.toHaveBeenCalled();
  });

  it('logout revokes jti when token valid', async () => {
    mockTokenService.validateRefreshToken.mockImplementation(() => Promise.resolve({ userId: 'u1', jti: 'j1' }));
    mockTokenService.revokeRefreshByJti.mockImplementation(() => Promise.resolve());

    const res = await service.logout('goodtoken');
    expect(mockTokenService.revokeRefreshByJti).toHaveBeenCalledWith('j1');
    expect(res).toEqual({ success: true });
  });
});
