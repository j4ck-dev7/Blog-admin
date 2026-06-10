import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import type { RedisClientType } from 'redis';
import type { JwtPayload } from 'jsonwebtoken';
import {
  AccessTokenPayload,
  RefreshTokenPayload,
  TokenPair,
  ValidatedRefreshToken,
} from './interfaces/jwt-payload.interface';

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(
    private readonly config: ConfigService,
    @Inject('REDIS_CLIENT') private readonly redis: RedisClientType,
  ) {}

  async generatePair(userId: string, role: string): Promise<TokenPair> {
    const jti: string = randomUUID();
    const accessSecret: string =
      this.config.get('JWT_ACCESS_SECRET') || this.config.get('JWT_SECRET') || 'change_me';
    const refreshSecret: string =
      this.config.get('JWT_REFRESH_SECRET') || this.config.get('JWT_SECRET') || 'change_me';

    const accessToken: string = jwt.sign(
      { sub: userId, role } as AccessTokenPayload,
      accessSecret,
      { expiresIn: '15m' },
    );
    const refreshToken: string = jwt.sign(
      { sub: userId, jti } as RefreshTokenPayload,
      refreshSecret,
      { expiresIn: '7d' },
    );

    // Store jti in redis with TTL 7 days
    try {
      await this.redis.setEx(`refresh:${jti}`, 7 * 24 * 60 * 60, userId);
    } catch (err: unknown) {
      this.logger.error('Failed to persist refresh jti', err as Error);
    }

    return { accessToken, refreshToken, jti };
  }

  async revokeRefreshByJti(jti: string): Promise<void> {
    try {
      await this.redis.del(`refresh:${jti}`);
    } catch (err: unknown) {
      this.logger.error('Failed to revoke refresh jti', err as Error);
    }
  }

  async validateRefreshToken(token: string): Promise<ValidatedRefreshToken | null> {
    const refreshSecret: string =
      this.config.get('JWT_REFRESH_SECRET') || this.config.get('JWT_SECRET') || 'change_me';
    try {
      const payload: JwtPayload = jwt.verify(token, refreshSecret) as JwtPayload;
      const jti: string | undefined = payload?.jti as string | undefined;
      if (!jti) return null;
      const userId = await this.redis.get(`refresh:${jti}`) as string | null;
      if (!userId) return null;
      return { userId, jti, payload: payload as RefreshTokenPayload };
    } catch (err: unknown) {
      this.logger.warn('Failed to validate refresh token', err as Error);
      return null;
    }
  }
}
