import { ConfigService } from '@nestjs/config';
import type { TransportOptions } from 'nodemailer';

export function createMailerConfig(config: ConfigService) {
  return {
    transport: {
        service: 'gmail',
        auth: {
            type: 'OAuth2',
            user: config.get('SMTP_USER'),
            clientId: config.get('GOOGLE_CLIENT_ID'),
            clientSecret: config.get('GOOGLE_CLIENT_SECRET'),
            refreshToken: config.get('GOOGLE_REFRESH_TOKEN')
        },
    } as TransportOptions,
  };
}
