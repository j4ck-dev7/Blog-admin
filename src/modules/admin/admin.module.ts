// user.module.ts
import { Module } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service.js';
import { adminRepository } from './repositories/admin.repository.js';
import { adminService } from './admin.service.js';

@Module({
  providers: [
    adminService,
    {
      provide: 'IAdminRepository',
      useClass: adminRepository,
    },
    PrismaService,
  ],
  exports: [adminService],
})
export class adminModule {}