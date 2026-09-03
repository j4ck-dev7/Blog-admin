import { beforeEach, afterEach, describe, expect, it, jest } from '@jest/globals';
import { AuthController } from '../auth.controller';

describe('AuthController', () => {
  let controller: AuthController;
  let mockAuthService: any;

  beforeEach(() => {
    mockAuthService = { login: jest.fn(), logout: jest.fn() };
    controller = new AuthController(mockAuthService);
  });

  afterEach(async () => jest.restoreAllMocks());

  it('login forwards to authService.login', async () => {
    const out = { accessToken: 'a', refreshToken: 'r' };
    mockAuthService.login.mockImplementation(() => Promise.resolve(out));

    const res = await controller.login({ email: 'a@b.com', password: 'pw' } as any);
    expect(mockAuthService.login).toHaveBeenCalledWith('a@b.com', 'pw');
    expect(res).toEqual(out);
  });

  it('logout forwards to authService.logout', async () => {
    mockAuthService.logout.mockImplementation(() => Promise.resolve({ success: true }));
    const res = await controller.logout('refresh-token');
    expect(mockAuthService.logout).toHaveBeenCalledWith('refresh-token');
    expect(res).toEqual({ success: true });
  });
});
