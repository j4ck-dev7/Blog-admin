import { Inject, Injectable } from '@nestjs/common';
import { MongoClient, ObjectId } from 'mongodb';
import { Article } from '../../../../domain/entities/article.entity';
import { IArticleRepository } from './article.repository.interface';

@Injectable()
export class ArticleRepository implements IArticleRepository {
  constructor(
    @Inject('MONGO_CLIENT') private readonly mongoClient: MongoClient,
  ) {}

  private getCollection() {
    return this.mongoClient.db('blog').collection<Article>('articles');
  }

  async createArticle(article: Article): Promise<string> {
    const collection = this.getCollection();
    const result = await collection.insertOne(article);

    return result.insertedId.toString();
  }

  async editArticle(articleId: string, newArticle: Article): Promise<any> {
    const collection = this.getCollection();

    try {
      await collection.updateOne(
        { _id: new ObjectId(articleId) },
        { $set: newArticle },
      );
    } catch (error) {
      throw new Error(`Erro ao atualizar artigo: ${(error as Error).message}`);
    }
  }

  async allArticles(skip: number, limit: number): Promise<Article[]> {
    const collection = this.getCollection();
    const query: Article[] = await collection
      .find({})
      .sort({ creationDate: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    return query.map((d) => ({
      _id: d._id,
      title: d.title,
      slug: d.slug,
      creationDate: d.creationDate,
      author: d.author,
      content: d.content,
      banner: d.banner,
      viewsCount: d.viewsCount,
      likeCount: d.likeCount,
      commentCount: d.commentCount,
    }));
  }

  async deleteArticle(articleId: string): Promise<any> {
    const collection = this.getCollection();
    ObjectId;
    try {
      await collection.deleteOne({ _id: new ObjectId(articleId) });
    } catch (error) {
      throw new Error(`Erro ao deletar artigo: ${(error as Error).message}`);
    }
  }

  async findBySlug(slug: string): Promise<boolean> {
    const collection = this.getCollection();

    try {
      const article = await collection.findOne({ slug });
      return !!article;
    } catch (error) {
      throw new Error(
        `Erro ao buscar artigo por slug: ${(error as Error).message}`,
      );
    }
  }

  async verifyBySlug(slug: string): Promise<string | null> {
    const collection = this.getCollection();

    try {
      const article = await collection.findOne({ slug });
      return article?._id.toString() || null;
    } catch (error) {
      throw new Error(
        `Erro ao verificar artigo por slug: ${(error as Error).message}`,
      );
    }
  }

  async findById(id: string): Promise<Article | null> {
    const collection = this.getCollection();
    const article = await collection.findOne({ _id: new ObjectId(id) });
    return article;
  }
}
