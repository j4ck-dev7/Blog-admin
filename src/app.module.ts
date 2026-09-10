import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PostgresModule } from './infrastructure/database/postgres/postgres.module';
import { MongoDbModule } from './infrastructure/database/mongodb/mongodb.module';
import appConfig from './config/app.config';
import { AuthModule } from './modules/auth/auth.module';
import { ArticlesModule } from './modules/articles/articles.module';
import { AuditModule } from './modules/audit/audit.module';
import { RedisClientProvider } from './config/redis.config';
import { MailerModule } from '@nestjs-modules/mailer';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
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
            refreshToken: config.get<string>('GOOGLE_REFRESH_TOKEN'),
          },
        },
      }),
    }),
    PostgresModule,
    MongoDbModule,
    AuthModule,
    ArticlesModule,
    AuditModule,
    AdminModule,
  ],
  providers: [RedisClientProvider],
  exports: [RedisClientProvider],
})
export class AppModule {}
