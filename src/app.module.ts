import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { PostgresModule } from './infrastructure/database/postgres/postgres.module';
import { MongoDbModule } from './infrastructure/database/mongodb/mongodb.module';
import appConfig from './config/app.config';
import { AuthModule } from './modules/auth/auth.module';
import { ArticlesModule } from './modules/articles/articles.module';
import { CommentsModule } from './modules/comments/comments.module';
import { LikesModule } from './modules/likes/likes.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [appConfig] }),
    PostgresModule,
    MongoDbModule,
    AuthModule,
    ArticlesModule,
    CommentsModule,
    LikesModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
