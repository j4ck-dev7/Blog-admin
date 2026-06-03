import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Article, ArticleSchema } from './schemas/article.schema.js';
import { ArticleController } from './articles.controller.js';
import { ArticleService } from './articles.service.js';
import { ArticleRepository } from './articles.repository.js';
import { RateLimitGuard } from './guards/rate-limit.guard.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Article.name, schema: ArticleSchema }]),
  ],
  controllers: [ArticleController],
  providers: [ArticleService, ArticleRepository, RateLimitGuard],
  exports: [ArticleService, ArticleRepository],
})
export class ArticleModule {}