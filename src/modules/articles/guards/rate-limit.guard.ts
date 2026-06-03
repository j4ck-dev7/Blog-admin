import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import type { RedisClientType } from 'redis';

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly limit = 100; // Requisições
  private readonly windowMs = 15 * 60 * 1000; // 15 minutos

  constructor(@Inject('REDIS_CLIENT') private readonly redis: RedisClientType) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.session?.userId;

    if (!userId) {
      throw new HttpException('Usuário não autenticado', HttpStatus.TOO_MANY_REQUESTS);
    }

    const key = `rate-limit:articles:${userId}`;
    const current = await this.redis.incr(key);

    if (current === 1) {
      await this.redis.expire(key, Math.ceil(this.windowMs / 1000));
    }

    if (current > this.limit) {
      throw new HttpException(
        `Limite de ${this.limit} requisições por ${Math.ceil(this.windowMs / 60000)} minutos excedido`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
