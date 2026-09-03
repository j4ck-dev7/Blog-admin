import { AuditController } from '../audit.controller';
import {
  beforeEach,
  afterEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

describe('AuditController', () => {
  let controller: AuditController;
  let mockAuditService: any;

  beforeEach(() => {
    mockAuditService = { allRecords: jest.fn() };
    controller = new AuditController(mockAuditService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('getAllRecords delegates to auditService.allRecords', async () => {
    const records = [{ id: 'audit1' }];
    mockAuditService.allRecords.mockResolvedValue(records);

    const result = await controller.getAllRecords();

    expect(mockAuditService.allRecords).toHaveBeenCalledTimes(1);
    expect(result).toBe(records);
  });
});
