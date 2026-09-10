import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
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
    generateSecret = jest.fn(() => 'BASE32');
    generateURI = jest.fn(() => 'otpauth://totp/blog-admin');
    verify = jest.fn(async () => ({ valid: true }));
  },
}));

jest.mock('isomorphic-dompurify', () => ({
  sanitize: (value: string) => value,
}));

jest.mock('../src/modules/admin/admin.service', () => ({
  AdminService: class {},
}));

import { AdminController } from '../src/modules/admin/admin.controller';
import { AdminService } from '../src/modules/admin/admin.service';
import { AdminAuthGuard } from '../src/common/guards/admin-auth.guard';

describe('AdminController (e2e)', () => {
  let app: INestApplication<App>;
  let adminService: any;

  beforeEach(async () => {
    adminService = {
      sendInvite: jest.fn(),
      generateMfaSecret: jest.fn(),
      completeInvite: jest.fn(),
      acceptInvite: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        {
          provide: AdminService,
          useValue: adminService,
        },
        {
          provide: AdminAuthGuard,
          useValue: {
            canActivate: (context: any) => {
              const req = context.switchToHttp().getRequest();
              req.session = {
                userId: 'user-1',
                email: 'sender@blog.com',
                name: 'Sender Admin',
              };
              return true;
            },
          },
        },
      ],
    })
      .overrideGuard(AdminAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          req.session = {
            userId: 'user-1',
            email: 'sender@blog.com',
            name: 'Sender Admin',
          };
          return true;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('POST /admin/invite/send creates the invite with the session sender data', async () => {
    const result = { inviteId: 'invite-1', token: 'token-1' };
    adminService.sendInvite.mockResolvedValue(result);

    const response = await request(app.getHttpServer())
      .post('/admin/invite/send')
      .send({ email: 'new-admin@blog.com' });

    expect(response.status).toBe(201);
    expect(response.body).toEqual(result);
    expect(adminService.sendInvite).toHaveBeenCalledWith(
      'new-admin@blog.com',
      'user-1',
      'Sender Admin',
      'sender@blog.com',
    );
  });

  it('POST /admin/invite/setup-mfa returns the generated MFA secret', async () => {
    const result = {
      otpauth_url: 'otpauth://totp/blog-admin%3Aadmin%3Ainvite-1?secret=BASE32',
      base32: 'BASE32',
    };
    adminService.generateMfaSecret.mockResolvedValue(result);

    const response = await request(app.getHttpServer())
      .post('/admin/invite/setup-mfa')
      .send({ token: 'invite-1' });

    expect(response.status).toBe(201);
    expect(response.body).toEqual(result);
    expect(adminService.generateMfaSecret).toHaveBeenCalledWith('invite-1');
  });

  it('POST /admin/invite/complete completes the invite flow', async () => {
    const result = {
      id: 'admin-user-1',
      name: 'Novo Admin',
      email: 'new-admin@blog.com',
    };
    adminService.completeInvite.mockResolvedValue(result);

    const response = await request(app.getHttpServer())
      .post('/admin/invite/complete')
      .send({
        token: 'invite-1',
        name: 'Novo Admin',
        password: 'Password123',
        totp: '123456',
      });

    expect(response.status).toBe(201);
    expect(response.body).toEqual(result);
    expect(adminService.completeInvite).toHaveBeenCalledWith(
      'invite-1',
      'Novo Admin',
      'Password123',
      '123456',
      expect.any(Object),
    );
  });

  it('POST /admin/invite/accept delegates to the service', async () => {
    const result = { success: true };
    adminService.acceptInvite.mockResolvedValue(result);

    const response = await request(app.getHttpServer())
      .post('/admin/invite/accept')
      .send({
        token: 'invite-1',
        name: 'Novo Admin',
        password: 'Password123',
      });

    expect(response.status).toBe(201);
    expect(response.body).toEqual(result);
    expect(adminService.acceptInvite).toHaveBeenCalledWith(
      'invite-1',
      'Novo Admin',
      'Password123',
      expect.any(Object),
    );
  });

  it('GET /admin/invite/accept returns the token and validity flag', async () => {
    const response = await request(app.getHttpServer()).get(
      '/admin/invite/accept?token=invite-1',
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ token: 'invite-1', valid: true });
  });
});
