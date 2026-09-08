import { ObjectId } from 'mongodb';
import { Article } from '../../../../domain/entities/article.entity';

export interface IArticleRepository {
  createArticle(article: Article): Promise<string>;
  editArticle(articleId: string, newArticle: Article): Promise<void>;
  allArticles(skip: number, limit: number): Promise<Article[]>;
  deleteArticle(articleId: string): Promise<void>;
  findBySlug(slug: string): Promise<boolean>;
  findById(id: string): Promise<Article | null>;
  verifyBySlug(slug: string): Promise<string | null>;
}
