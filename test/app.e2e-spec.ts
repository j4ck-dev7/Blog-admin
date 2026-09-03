import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AuthController } from '../src/modules/auth/auth.controller';
import { AuthService } from '../src/modules/auth/auth.service';
import { TokenService } from '../src/modules/auth/token.service';
import { adminPostgresRepository } from '../src/infrastructure/database/postgres/repositories/admin.repository';
import { hashPassword } from '../src/config/argon2.config';
import { AuditService } from '../src/modules/audit/audit.service';

describe('AuthController (e2e)', () => {
  let app: INestApplication<App>;
  let tokenServiceMock: {
    generatePair: jest.Mock;
    validateRefreshToken: jest.Mock;
    revokeRefreshByJti: jest.Mock;
  };
  let repositoryMock: {
    findByEmail: jest.Mock;
  };
  let auditServiceMock: {
    record: jest.Mock;
  };

  beforeEach(async () => {
    tokenServiceMock = {
      generatePair: jest.fn(),
      validateRefreshToken: jest.fn(),
      revokeRefreshByJti: jest.fn(),
    };

    repositoryMock = {
      findByEmail: jest.fn(),
    };

    auditServiceMock = {
      record: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        { provide: TokenService, useValue: tokenServiceMock },
        { provide: adminPostgresRepository, useValue: repositoryMock },
        { provide: AuditService, useValue: auditServiceMock },
        {
          provide: 'REDIS_CLIENT',
          useValue: {
            incr: jest.fn().mockResolvedValue(1),
            expire: jest.fn().mockResolvedValue(1),
            setEx: jest.fn().mockResolvedValue('OK'),
            del: jest.fn().mockResolvedValue(1),
            get: jest.fn().mockResolvedValue(null),
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('should return 401 when email is not registered', async () => {
    repositoryMock.findByEmail.mockResolvedValue(null);

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'naoexiste@email.com',
        password: 'senha1234',
      });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Invalid credentials');
  });

  it('should return 401 when password is wrong', async () => {
    repositoryMock.findByEmail.mockResolvedValue({
      id: 'user-1',
      password: await hashPassword('senhaCorreta123'),
      role: 'admin',
    });

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin@email.com',
        password: 'senhaErrada123',
      });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Invalid credentials');
    expect(tokenServiceMock.generatePair).not.toHaveBeenCalled();
  });

  it('should return 201 and tokens when login succeeds', async () => {
    repositoryMock.findByEmail.mockResolvedValue({
      id: 'user-1',
      password: await hashPassword('senhaCorreta123'),
      role: 'admin',
    });

    tokenServiceMock.generatePair.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      jti: 'jwt-id',
    });

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin@email.com',
        password: 'senhaCorreta123',
      });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      admin: {
        id: 'user-1',
      },
    });
    expect(tokenServiceMock.generatePair).toHaveBeenCalledWith('user-1');
    expect(auditServiceMock.record).toHaveBeenCalledWith(
      'user-1',
      'ADMIN_LOGIN',
      'Admin user-1 logged in',
    );
  });

  it('should return success for invalid refresh token on logout', async () => {
    tokenServiceMock.validateRefreshToken.mockResolvedValue(null);

    const response = await request(app.getHttpServer())
      .post('/auth/logout')
      .send({
        refreshToken: 'token-invalido',
      });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ success: true });
    expect(tokenServiceMock.revokeRefreshByJti).not.toHaveBeenCalled();
  });

  it('should revoke refresh token when logout receives a valid token', async () => {
    tokenServiceMock.validateRefreshToken.mockResolvedValue({
      userId: 'user-1',
      jti: 'refresh-jti-123',
    });

    const response = await request(app.getHttpServer())
      .post('/auth/logout')
      .send({
        refreshToken: 'token-valido',
      });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ success: true });
    expect(tokenServiceMock.revokeRefreshByJti).toHaveBeenCalledWith(
      'refresh-jti-123',
    );
    expect(auditServiceMock.record).toHaveBeenCalledWith(
      'user-1',
      'ADMIN_LOGOUT',
      'Admin user-1 logged out',
    );
  });

  it('should return success when refresh token is missing', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/logout')
      .send({});

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ success: true });
    expect(tokenServiceMock.validateRefreshToken).toHaveBeenCalledWith(
      undefined,
    );
  });
});
