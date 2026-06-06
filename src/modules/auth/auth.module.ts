import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { AuthRateLimitGuard } from './guards/rate-limit.guard';
import { RedisClientProvider } from '../../config/redis.config';

@Module({
  imports: [ConfigModule],
  controllers: [AuthController],
  providers: [AuthService, TokenService, AuthRateLimitGuard, RedisClientProvider],
  exports: [AuthService, TokenService],
})
export class AuthModule {}
