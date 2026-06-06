import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule } from '@nestjs/config';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AuditModule } from '../audit/audit.module';
import { RedisClientProvider } from '../../config/redis.config';

@Module({
  imports: [MailerModule, ConfigModule, AuditModule],
  controllers: [AdminController],
  providers: [AdminService, RedisClientProvider],
  exports: [AdminService, RedisClientProvider],
})
export class AdminModule {}