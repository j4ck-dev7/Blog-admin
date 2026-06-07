import { Controller, Post, Body, Req, Get, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { SendInviteDto } from './dtos/send-invite.dto';
import { SetupMfaDto } from './dtos/setup-mfa.dto';
import { CompleteInviteDto } from './dtos/complete-invite.dto';
import { AcceptInviteDto } from './dtos/accept-invite.dto';
import { RequestWithSession } from '../../common/interfaces/request-with-session.interface';

@Controller('admin/invite')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('send')
  @UseGuards(AdminAuthGuard)
  async send(@Body() body: SendInviteDto, @Req() req: RequestWithSession) {
    const { email } = body;
    // use session info as sender by default
    const senderId = req?.session?.userId;
    const senderEmail = req?.session?.email;
    const senderName = req?.session?.name;
    return this.adminService.sendInvite(email, senderId, senderName, senderEmail);
  }

  @Post('setup-mfa')
  async setupMfa(@Body() body: SetupMfaDto) {
    const { token } = body;
    return this.adminService.generateMfaSecret(token);
  }

  @Post('complete')
  async complete(@Body() body: CompleteInviteDto, @Req() req: RequestWithSession) {
    const { token, name, password, totp } = body;
    return this.adminService.completeInvite(token, name, password, totp, req);
  }

  @Post('accept')
  async accept(@Body() body: AcceptInviteDto, @Req() req: RequestWithSession) {
    const { token, name, password } = body;
    return this.adminService.acceptInvite(token, name, password, req);
  }

  // simple link handler for clicking the email link (GET) — frontend may call POST with data
  @Get('accept')
  async acceptGet(@Query('token') token: string) {
    // Return a minimal response; frontend should show a form to finish registration
    return { token, valid: !!token };
  }
}
