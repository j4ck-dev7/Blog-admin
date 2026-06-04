import { AuditService, AuditActionType } from '../audit.service.js';
import { beforeEach, afterEach, describe, expect, it, jest } from '@jest/globals';

describe('AuditService', () => {
  let service: AuditService;
  let mockPrismaRepository: any;

  beforeEach(() => {
    mockPrismaRepository = {
      createAudit: jest.fn(),
      getRecentAudits: jest.fn(),
    };

    service = new AuditService(mockPrismaRepository);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should call createAudit and return the created record', async () => {
    const payload = {
      action: AuditActionType.SYSTEM_CHANGE,
      actorId: 'actor-1',
      description: 'Changed system setting',
    };

    const result = { id: 'audit-1', ...payload, createdAt: new Date() } as any;

    mockPrismaRepository.createAudit.mockImplementation(() => Promise.resolve(result));

    const res = await service.record(payload as any);

    expect(mockPrismaRepository.createAudit).toHaveBeenCalled();
    const calledArg = mockPrismaRepository.createAudit.mock.calls[0][0];
    expect(calledArg).toMatchObject(payload);
    expect(calledArg.createdAt).toBeInstanceOf(Date);
    expect(res).toEqual(result);
  });

  it('should call getRecentAudits with default limit and return results', async () => {
    const audits = [ { id: 'a1' }, { id: 'a2' } ] as any;
    mockPrismaRepository.getRecentAudits.mockImplementation(() => Promise.resolve(audits));

    const res = await service.listRecent();

    expect(mockPrismaRepository.getRecentAudits).toHaveBeenCalledWith(50);
    expect(res).toEqual(audits);
  });

  it('should call getRecentAudits with provided limit', async () => {
    const audits = [ { id: 'b1' } ] as any;
    mockPrismaRepository.getRecentAudits.mockImplementation(() => Promise.resolve(audits));

    const res = await service.listRecent(10);

    expect(mockPrismaRepository.getRecentAudits).toHaveBeenCalledWith(10);
    expect(res).toEqual(audits);
  });
});
