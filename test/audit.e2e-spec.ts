import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AuditController } from '../src/modules/audit/audit.controller';
import { AuditService } from '../src/modules/audit/audit.service';
import { AuditActionType } from '../src/domain/entities/audit.entity';

describe('AuditController (e2e)', () => {
  let app: INestApplication<App>;
  let auditServiceMock: {
    allRecords: jest.Mock;
  };

  beforeEach(async () => {
    auditServiceMock = {
      allRecords: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuditController],
      providers: [{ provide: AuditService, useValue: auditServiceMock }],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('should return all audit records', async () => {
    const records = [
      {
        id: 'audit-1',
        action: AuditActionType.ADMIN_LOGIN,
        actorId: 'admin-1',
        actorName: 'Admin',
        actorEmail: 'admin@example.com',
        actorRole: 'admin',
        description: 'Admin logged in',
        createdAt: new Date('2026-09-03T12:00:00.000Z'),
      },
    ];
    auditServiceMock.allRecords.mockResolvedValue(records);

    const response = await request(app.getHttpServer()).get('/audit/records');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      {
        ...records[0],
        createdAt: records[0].createdAt.toISOString(),
      },
    ]);
    expect(auditServiceMock.allRecords).toHaveBeenCalledTimes(1);
  });
});
