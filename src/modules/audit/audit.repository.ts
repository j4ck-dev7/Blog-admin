import { Injectable } from '@nestjs/common';
import { prisma } from '../../config/prisma';

@Injectable()
export class AuditRepository {
  async createAudit(data: any) {
    return prisma.audit.create({ data });
  }

  async getRecentAudits(limit = 50) {
    return prisma.audit.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
