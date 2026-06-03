import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import type { RedisClientType } from 'redis';

@Injectable()
export class AuthRateLimitGuard implements CanActivate {
  private readonly limit = 10; // stricter for auth
  private readonly windowMs = 15 * 60 * 1000; // 15 minutes

  constructor(@Inject('REDIS_CLIENT') private readonly redis: RedisClientType) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const key = `rate:auth:${ip}`;
    const current = await this.redis.incr(key);
    if (current === 1) await this.redis.expire(key, Math.ceil(this.windowMs / 1000));
    if (current > this.limit) {
      throw new HttpException('Too many authentication attempts', HttpStatus.TOO_MANY_REQUESTS);
    }
    return true;
  }
}
