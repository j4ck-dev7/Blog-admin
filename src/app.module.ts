import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { MailerModule } from '@nestjs-modules/mailer';
import { WinstonModule } from 'nest-winston';
import { AuditModule } from './modules/audit/audit.module.js';
import { AppController } from './app.controller.js';
import { AdminModule } from './modules/admin/admin.module.js';
import { loggerConfig } from './config/logger.js';

@Module({
  imports: [
    WinstonModule.forRoot(loggerConfig),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        transport: {
          service: 'gmail',
          auth: {
            type: 'OAuth2',
            user: config.get('SMTP_USER'),
            clientId: config.get('GOOGLE_CLIENT_ID'),
            clientSecret: config.get('GOOGLE_CLIENT_SECRET'),
            refreshToken: config.get('GOOGLE_REFRESH_TOKEN')
          },
        },
      }),
    }),
    MongooseModule.forRoot(process.env.MONGO_CONNECT!),
    AuditModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [],
})

export class AppModule {}
