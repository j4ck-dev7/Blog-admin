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
import { AuditService } from '../audit/audit.service';
import { AuditActionType } from '../../domain/entities/audit.entity';

interface LoginResult {
  accessToken: string;
  refreshToken: string;
  admin: {
    id: string;
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
    private readonly auditService: AuditService,
  ) {
    this.repository = repository;
    this.tokenService = tokenService;
    this.auditService = auditService;
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
    const pair: TokenPair = await this.tokenService.generatePair(admin.id);

    await this.auditService.record(
      admin.id,
      AuditActionType.ADMIN_LOGIN,
      `Admin ${admin.id} logged in`,
    );

    return {
      accessToken: pair.accessToken,
      refreshToken: pair.refreshToken,
      admin: {
        id: admin.id,
      },
    };
  }

  async logout(refreshToken: string): Promise<LogoutResult> {
    const validated: ValidatedRefreshToken | null =
      await this.tokenService.validateRefreshToken(refreshToken);
    if (!validated) return { success: true };
    await this.tokenService.revokeRefreshByJti(validated.jti);

    await this.auditService.record(
      validated.userId,
      AuditActionType.ADMIN_LOGOUT,
      `Admin ${validated.userId} logged out`,
    );
    return { success: true };
  }
}
