import { Injectable } from '@nestjs/common';
import { prisma } from '../../config/prisma';
import type { Audit, Prisma } from '../../../generated/prisma/client';

@Injectable()
export class AuditRepository {
  async createAudit(data: Prisma.AuditCreateInput): Promise<Audit> {
    return prisma.audit.create({ data });
  }

  async getRecentAudits(limit: number = 50): Promise<Audit[]> {
    return prisma.audit.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
