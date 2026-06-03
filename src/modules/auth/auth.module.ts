import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { TokenService } from './token.service.js';
import { AuthRateLimitGuard } from './guards/rate-limit.guard.js';
import { RedisClientProvider } from '../../config/redis.config.js';

@Module({
  imports: [ConfigModule],
  controllers: [AuthController],
  providers: [AuthService, TokenService, AuthRateLimitGuard, RedisClientProvider],
  exports: [AuthService, TokenService],
})
export class AuthModule {}
