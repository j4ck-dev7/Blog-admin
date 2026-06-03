import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { AdminAuthGuard } from '../src/common/guards/admin-auth.guard.js';
import { MailerService } from '@nestjs-modules/mailer';
import speakeasy from 'speakeasy';
import { afterAll, afterEach, beforeAll, describe, expect, it, jest } from '@jest/globals';

jest.mock('../src/config/prisma.js', () => {
  const mockPrisma = {
    invite: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      create: jest.fn(),
    },
    $disconnect: jest.fn(),
    $connect: jest.fn(),
    $transaction: jest.fn(),
  };
  return { prisma: mockPrisma }
})

import { prisma } from '../src/config/prisma.js';
jest.setTimeout(30000);

const mockMailer = {
  sendMail: jest.fn(),
};

const mockRedis = {
  get: jest.fn(),
  setEx: jest.fn(),
  del: jest.fn(),
};

const mockAdminAuthGuard = {
  canActivate: () => true,
};

describe('Admin invite flow (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MailerService)
      .useValue(mockMailer)
      .overrideGuard(AdminAuthGuard)
      .useValue(mockAdminAuthGuard)
      .overrideProvider('REDIS_CLIENT')
      .useValue(mockRedis)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should send invite, setup MFA, and complete the admin invite', async () => {
    const invite = { id: 'invite-123', email: 'admin@example.com', senderId: 'sender-1' } as any;
    jest.spyOn(prisma.invite, 'create').mockResolvedValue(invite);
    mockRedis.get.mockImplementation(() => Promise.resolve('invite-123'));

    const sendResponse = await request(app.getHttpServer())
      .post('/admin/invite/send')
      .send({ email: 'admin@example.com', senderId: 'sender-1', senderName: 'Sender', senderEmail: 'sender@example.com' })
      .expect(201);

    expect(sendResponse.body).toHaveProperty('token');
    const token = sendResponse.body.token;
    expect(mockMailer.sendMail).toHaveBeenCalled();
    expect(mockRedis.setEx).toHaveBeenCalledWith(expect.stringContaining('admin_invite:'), 900, 'invite-123');

    const setupResponse = await request(app.getHttpServer())
      .post('/admin/invite/setup-mfa')
      .send({ token })
      .expect(201);

    expect(setupResponse.body).toHaveProperty('otpauth_url');
    expect(setupResponse.body).toHaveProperty('base32');
    expect(mockRedis.setEx).toHaveBeenCalledWith(`admin_invite:mfa:${token}`, 900, setupResponse.body.base32);

    mockRedis.get.mockImplementation(() => Promise.resolve('invite-123')).mockImplementation(() => Promise.resolve(setupResponse.body.base32));
    jest.spyOn(prisma.invite, 'findUnique').mockResolvedValue(invite);
    jest.spyOn(prisma.user, 'create').mockResolvedValue({ id: 'user-1', name: 'newadmin', email: 'admin@example.com' } as any);
    jest.spyOn(prisma.invite, 'update').mockResolvedValue({ ...invite, acceptedAt: new Date(), status: 'ACCEPTED' } as any);

    const totp = speakeasy.totp({ secret: setupResponse.body.base32, encoding: 'base32' });

    const completeResponse = await request(app.getHttpServer())
      .post('/admin/invite/complete')
      .send({ token, name: 'newadmin', password: 'Password123!', totp })
      .expect(201);

    expect(completeResponse.body).toMatchObject({ id: 'user-1', name: 'newadmin', email: 'admin@example.com' });
    expect(mockRedis.del).toHaveBeenCalledWith(`admin_invite:${token}`);
    expect(mockRedis.del).toHaveBeenCalledWith(`admin_invite:mfa:${token}`);
  });
});
