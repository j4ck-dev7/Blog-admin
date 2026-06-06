import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import type { RedisClientType } from 'redis';

@Injectable()
export class TokenService {
  constructor(
    private readonly config: ConfigService,
    @Inject('REDIS_CLIENT') private readonly redis: RedisClientType,
  ) {}

  async generatePair(userId: string, role: string) {
    const jti = randomUUID();
    const accessSecret = this.config.get('JWT_ACCESS_SECRET') || this.config.get('JWT_SECRET') || 'change_me';
    const refreshSecret = this.config.get('JWT_REFRESH_SECRET') || this.config.get('JWT_SECRET') || 'change_me';

    const accessToken = jwt.sign({ sub: userId, role }, accessSecret, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ sub: userId, jti }, refreshSecret, { expiresIn: '7d' });

    // Store jti in redis with TTL 7 days
    try {
      await this.redis.setEx(`refresh:${jti}`, 7 * 24 * 60 * 60, userId);
    } catch (err) {
      // best-effort
      console.error('Failed to persist refresh jti', err);
    }

    return { accessToken, refreshToken, jti };
  }

  async revokeRefreshByJti(jti: string) {
    try {
      await this.redis.del(`refresh:${jti}`);
    } catch (err) {
      console.error('Failed to revoke refresh jti', err);
    }
  }

  async validateRefreshToken(token: string) {
    const refreshSecret = this.config.get('JWT_REFRESH_SECRET') || this.config.get('JWT_SECRET') || 'change_me';
    try {
      const payload = jwt.verify(token, refreshSecret) as any;
      const jti = payload?.jti;
      if (!jti) return null;
      const userId = await this.redis.get(`refresh:${jti}`);
      if (!userId) return null;
      return { userId, jti, payload };
    } catch (err) {
      return null;
    }
  }
}
