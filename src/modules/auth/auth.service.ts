import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { prisma } from '../../config/prisma';
import { verifyPassword } from '../../config/argon2.config';
import { TokenService } from './token.service';
import type { User } from '../../../generated/prisma/client';
import type { TokenPair, ValidatedRefreshToken } from './interfaces/jwt-payload.interface';

interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string | null;
  };
}

interface LogoutResult {
  success: boolean;
}

@Injectable()
export class AuthService {
  constructor(private readonly tokenService: TokenService) {}

  async validateUserByEmail(email: string, password: string): Promise<User | null> {
    const user: User | null = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) return null;
    const ok: boolean = await verifyPassword(user.password, password);
    if (!ok) return null;
    return user;
  }

  async login(email: string, password: string): Promise<LoginResult> {
    if (!email || !password) throw new BadRequestException('Missing credentials');
    const user: User | null = await this.validateUserByEmail(email, password);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const pair: TokenPair = await this.tokenService.generatePair(user.id, user.role ?? 'user');
    return {
      accessToken: pair.accessToken,
      refreshToken: pair.refreshToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    };
  }

  async logout(refreshToken: string): Promise<LogoutResult> {
    const validated: ValidatedRefreshToken | null = await this.tokenService.validateRefreshToken(
      refreshToken,
    );
    if (!validated) return { success: true };
    await this.tokenService.revokeRefreshByJti(validated.jti);
    return { success: true };
  }
}
