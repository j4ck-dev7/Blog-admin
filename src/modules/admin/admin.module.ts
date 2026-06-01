// user.module.ts
import { Module } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { adminRepository } from './repositories/admin.repository';
import { adminService } from './admin.service';

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