import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { MailerModule } from '@nestjs-modules/mailer';
import { WinstonModule } from 'nest-winston';
import { AuditModule } from './modules/audit/audit.module';
import { AdminModule } from './modules/admin/admin.module';
import { AuthModule } from './modules/auth/auth.module';
import { ArticleModule } from './modules/articles/articles.module';
import { loggerConfig } from './config/logger';
import { RedisClientProvider } from './config/redis.config';

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
            user: config.get<string>('SMTP_USER'),
            clientId: config.get<string>('GOOGLE_CLIENT_ID'),
            clientSecret: config.get<string>('GOOGLE_CLIENT_SECRET'),
            refreshToken: config.get<string>('GOOGLE_REFRESH_TOKEN')
          },
        },
      }),
    }),
    MongooseModule.forRoot(process.env.MONGO_CONNECT!),
    AuditModule,
    AdminModule,
    AuthModule,
    ArticleModule,
  ],
  providers: [RedisClientProvider],
  exports: [RedisClientProvider],
})
export class AppModule {}