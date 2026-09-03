import { AuditActionType } from '../../../domain/entities/audit.entity';
import { AuditService } from '../audit.service';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

describe('AuditService', () => {
  let auditService: AuditService;
  let mockAuditRepository: any;
  let mockAdminRepository: any;

  beforeEach(() => {
    mockAuditRepository = {
      createAudit: jest.fn(),
      allAudits: jest.fn(),
    };
    mockAdminRepository = {
      findById: jest.fn(),
    };
    auditService = new AuditService(mockAuditRepository, mockAdminRepository);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('record finds the admin and creates an audit with the correct payload', async () => {
    const actorId = 'actor1';
    const action = AuditActionType.ADMIN_LOGIN;
    const description = 'User logged in';
    mockAdminRepository.findById.mockResolvedValue({
      name: 'John Doe',
      email: 'john.doe@example.com',
      role: 'admin',
    });

    await auditService.record(actorId, action, description);

    expect(mockAdminRepository.findById).toHaveBeenCalledWith(actorId);
    expect(mockAuditRepository.createAudit).toHaveBeenCalledWith({
      action,
      actorId,
      actorName: 'John Doe',
      actorEmail: 'john.doe@example.com',
      actorRole: 'admin',
      description,
      createdAt: expect.any(Date),
    });
  });

  it('allRecords returns every audit record from the repository', async () => {
    const records = [
      {
        id: 'audit1',
        action: AuditActionType.ADMIN_LOGIN,
        actorId: 'actor1',
      },
    ];
    mockAuditRepository.allAudits.mockResolvedValue(records);

    const result = await auditService.allRecords();

    expect(mockAuditRepository.allAudits).toHaveBeenCalledTimes(1);
    expect(result).toBe(records);
  });

  it('record propagates errors from the admin repository', async () => {
    const error = new Error('Admin not found');
    mockAdminRepository.findById.mockRejectedValue(error);

    await expect(
      auditService.record(
        'actor1',
        AuditActionType.ADMIN_LOGIN,
        'User logged in',
      ),
    ).rejects.toBe(error);
    expect(mockAuditRepository.createAudit).not.toHaveBeenCalled();
  });
});
