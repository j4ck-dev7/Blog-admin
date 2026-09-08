import { Module } from '@nestjs/common';
import { ArticleService } from './articles.service';

@Module({
  providers: [ArticleService],
  exports: [ArticleService],
})
export class ArticlesModule {}
