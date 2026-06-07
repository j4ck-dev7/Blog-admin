import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Article, ArticleSchema } from './schemas/article.schema';
import { ArticleController } from './articles.controller';
import { ArticleService } from './articles.service';
import { ArticleRepository } from './articles.repository';
import { RateLimitGuard } from './guards/rate-limit.guard';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Article.name, schema: ArticleSchema }]),
  ],
  controllers: [ArticleController],
  providers: [ArticleService, ArticleRepository, RateLimitGuard],
  exports: [ArticleService, ArticleRepository],
})
export class ArticleModule {}