import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';

@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('records')
  async getAllRecords() {
    const records = await this.auditService.allRecords();
    return records;
  }
}
