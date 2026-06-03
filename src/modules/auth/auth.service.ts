import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { prisma } from '../../config/prisma.js';
import { verifyPassword } from '../../config/argon2.config.js';
import { TokenService } from './token.service.js';

@Injectable()
export class AuthService {
  constructor(private readonly tokenService: TokenService) {}

  async validateUserByEmail(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) return null;
    const ok = await verifyPassword(user.password, password);
    if (!ok) return null;
    return user;
  }

  async login(email: string, password: string) {
    if (!email || !password) throw new BadRequestException('Missing credentials');
    const user = await this.validateUserByEmail(email, password);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const pair = await this.tokenService.generatePair(user.id, user.role ?? 'user');
    return {
      accessToken: pair.accessToken,
      refreshToken: pair.refreshToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    };
  }

  async logout(refreshToken: string) {
    const validated = await this.tokenService.validateRefreshToken(refreshToken);
    if (!validated) return { success: true };
    await this.tokenService.revokeRefreshByJti(validated.jti);
    return { success: true };
  }
}
