import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { verifyPassword } from '../../config/argon2.config';
import { TokenService } from './token.service';
import type {
  TokenPair,
  ValidatedRefreshToken,
} from './interfaces/jwt-payload.interface';
import { adminPostgresRepository } from '../../infrastructure/database/postgres/repositories/admin.repository';
import { Admin } from '../../domain/entities/admin.entity';

interface LoginResult {
  accessToken: string;
  refreshToken: string;
  admin: {
    id: string;
    role: string | null;
  };
}

interface LogoutResult {
  success: boolean;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly tokenService: TokenService,
    private readonly repository: adminPostgresRepository,
  ) {
    this.repository = repository;
  }

  async validateUserByEmail(
    email: string,
    password: string,
  ): Promise<Admin | null> {
    const admin: Admin | null = await this.repository.findByEmail(email);
    if (!admin || !admin.password) return null;
    const ok: boolean = await verifyPassword(admin.password, password);
    if (!ok) return null;
    return admin;
  }

  async login(email: string, password: string): Promise<LoginResult> {
    if (!email || !password)
      throw new BadRequestException('Missing credentials');
    const admin: Admin | null = await this.validateUserByEmail(email, password);
    if (!admin) throw new UnauthorizedException('Invalid credentials');
    const pair: TokenPair = await this.tokenService.generatePair(
      admin.id,
      admin.role,
    );
    return {
      accessToken: pair.accessToken,
      refreshToken: pair.refreshToken,
      admin: {
        id: admin.id,
        role: admin.role,
      },
    };
  }

  async logout(refreshToken: string): Promise<LogoutResult> {
    const validated: ValidatedRefreshToken | null =
      await this.tokenService.validateRefreshToken(refreshToken);
    if (!validated) return { success: true };
    await this.tokenService.revokeRefreshByJti(validated.jti);
    return { success: true };
  }
}
