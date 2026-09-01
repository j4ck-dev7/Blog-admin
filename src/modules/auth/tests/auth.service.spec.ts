import { AuthService } from '../auth.service';
import {
  beforeEach,
  afterEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { adminPostgresRepository } from '../../../infrastructure/database/postgres/repositories/admin.repository';

describe('AuthService', () => {
  let service: AuthService;
  let mockTokenService: any;
  let mockRepository: any;

  beforeEach(() => {
    mockTokenService = {
      generatePair: jest.fn(),
      validateRefreshToken: jest.fn(),
      revokeRefreshByJti: jest.fn(),
    };

    mockRepository = {
      findByEmail: jest.fn(),
    };

    service = new AuthService(mockTokenService as any, mockRepository as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('validateUserByEmail returns null when not found', async () => {
    jest
      .spyOn(adminPostgresRepository.prototype, 'findByEmail')
      .mockResolvedValue(null);
    const res = await service.validateUserByEmail('no@one.com', 'x');
    expect(res).toBeNull();
  });

  it('login throws BadRequestException when missing credentials', async () => {
    await expect(service.login(null as any, null as any)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('login throws UnauthorizedException for invalid credentials', async () => {
    jest
      .spyOn(service, 'validateUserByEmail')
      .mockImplementation(() => Promise.resolve(null));
    await expect(service.login('a@b.com', 'pw')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('login returns tokens and user on success', async () => {
    const user = { id: 'u1', role: 'admin' } as any;
    jest
      .spyOn(service, 'validateUserByEmail')
      .mockImplementation(() => Promise.resolve(user));
    mockTokenService.generatePair.mockImplementation(() =>
      Promise.resolve({ accessToken: 'a', refreshToken: 'r', jti: 'j' }),
    );

    const res = await service.login('a@b.com', 'pw');
    expect(mockTokenService.generatePair).toHaveBeenCalledWith('u1', 'admin');
    expect(res).toEqual(
      expect.objectContaining({
        accessToken: 'a',
        refreshToken: 'r',
        admin: { id: 'u1', role: 'admin' },
      }),
    );
  });

  it('logout returns success true when token invalid', async () => {
    mockTokenService.validateRefreshToken.mockImplementation(() =>
      Promise.resolve(null),
    );
    const res = await service.logout('badtoken');
    expect(res).toEqual({ success: true });
    expect(mockTokenService.revokeRefreshByJti).not.toHaveBeenCalled();
  });

  it('logout revokes jti when token valid', async () => {
    mockTokenService.validateRefreshToken.mockImplementation(() =>
      Promise.resolve({ userId: 'u1', jti: 'j1' }),
    );
    mockTokenService.revokeRefreshByJti.mockImplementation(() =>
      Promise.resolve(),
    );

    const res = await service.logout('goodtoken');
    expect(mockTokenService.revokeRefreshByJti).toHaveBeenCalledWith('j1');
    expect(res).toEqual({ success: true });
  });
});
