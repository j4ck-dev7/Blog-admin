import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class AdminAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    const session = req.session;
    if (!session || !session.userId) throw new UnauthorizedException('Not authenticated');
    if (session.role !== 'admin') throw new UnauthorizedException('Admin role required');
    return true;
  }
}
