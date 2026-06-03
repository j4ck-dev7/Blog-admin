import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule } from '@nestjs/config';
import { AdminService } from './admin.service.js';
import { AdminController } from './admin.controller.js';
import { AuditModule } from '../audit/audit.module.js';
import { RedisClientProvider } from '../../config/redis.config.js';

@Module({
  imports: [MailerModule, ConfigModule, AuditModule],
  controllers: [AdminController],
  providers: [AdminService, RedisClientProvider],
})

export class AdminModule {}