import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule } from '@nestjs/config';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AdminRepository } from './repositories/admin.repository';
import { AuditModule } from '../audit/audit.module';
import { RedisClientProvider } from '../../config/redis.config';

@Module({
  imports: [MailerModule, ConfigModule, AuditModule],
  controllers: [AdminController],
  providers: [AdminService, AdminRepository, RedisClientProvider],
  exports: [AdminService, AdminRepository, RedisClientProvider],
})
export class AdminModule {}