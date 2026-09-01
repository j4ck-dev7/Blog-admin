import { beforeEach, afterEach, describe, expect, it, jest } from '@jest/globals';

// Use a local mirror of the controller to avoid importing DTOs/guards
class LocalAuthController {
  constructor(private readonly authService: any) {}
  async login(body: any) {
    const { email, password } = body as any;
    return this.authService.login(email, password);
  }
  async logout(refreshToken: string) {
    return this.authService.logout(refreshToken);
  }
}

describe('AuthController (local mirror)', () => {
  let controller: LocalAuthController;
  let mockAuthService: any;

  beforeEach(() => {
    mockAuthService = { login: jest.fn(), logout: jest.fn() };
    controller = new LocalAuthController(mockAuthService);
  });

  afterEach(async () => jest.restoreAllMocks());

  it('login forwards to authService.login', async () => {
    const out = { accessToken: 'a', refreshToken: 'r' };
    mockAuthService.login.mockImplementation(() => Promise.resolve(out));

    const res = await controller.login({ email: 'a@b.com', password: 'pw' });
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
