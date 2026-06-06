import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { TokenService } from '../src/modules/auth/token.service';
import { AuthService } from '../src/modules/auth/auth.service';
import { AuthRateLimitGuard } from '../src/modules/auth/guards/rate-limit.guard';
import { afterAll, beforeAll, afterEach, describe, expect, it, jest } from '@jest/globals';
import { startInMemoryMongo, stopInMemoryMongo } from './setup';

const mockRedis = { 
  get: jest.fn(), 
  setEx: jest.fn(), 
  del: jest.fn(),
  incr: jest.fn(),
  expire: jest.fn(),
};

const mockTokenService = {
  generatePair: jest.fn(),
  validateRefreshToken: jest.fn(),
  revokeRefreshByJti: jest.fn(),
} as unknown as TokenService;

const mockAuthService = {
  login: jest.fn(),
  logout: jest.fn(),
} as unknown as AuthService;

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    await startInMemoryMongo();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    })
      .overrideProvider(AuthService)
      .useValue(mockAuthService)
      .overrideProvider(TokenService)
      .useValue(mockTokenService)
      .overrideProvider('REDIS_CLIENT')
      .useValue(mockRedis)
      .overrideGuard(AuthRateLimitGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await stopInMemoryMongo();
  });

  afterEach(() => { jest.clearAllMocks(); });

  it('should login and return tokens + user info', async () => {
    const user = { id: 'u-1', email: 'admin@example.com', name: 'Admin' };
    mockAuthService.login = jest.fn().mockResolvedValue({ 
      accessToken: 'at', 
      refreshToken: 'rt', 
      user 
    });

    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@example.com', password: 'Password123!' })
      .expect(201);

    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
    expect(mockAuthService.login).toHaveBeenCalledWith('admin@example.com', 'Password123!');
  });

  it('should logout and revoke refresh token when valid', async () => {
    mockAuthService.logout = jest.fn().mockResolvedValue({ success: true });

    const res = await request(app.getHttpServer())
      .post('/auth/logout')
      .send({ refreshToken: 'rt' })
      .expect(201);

    expect(res.body).toEqual({ success: true });
    expect(mockAuthService.logout).toHaveBeenCalledWith('rt');
  });
});