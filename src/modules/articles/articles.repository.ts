import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Article, ArticleDocument } from './schemas/article.schema.js';
import type { CreateArticleDto } from './dtos/create-article.dto.js';
import type { UpdateArticleDto } from './dtos/update-article.dto.js';

@Injectable()
export class ArticleRepository {
  constructor(@InjectModel(Article.name) private articleModel: Model<ArticleDocument>) {}

  async create(createArticleDto: CreateArticleDto): Promise<ArticleDocument> {
    const newArticle = new this.articleModel(createArticleDto);
    return newArticle.save();
  }

  async findById(id: string): Promise<ArticleDocument | null> {
    return this.articleModel.findById(id);
  }

  async findBySlug(slug: string): Promise<ArticleDocument | null> {
    return this.articleModel.findOne({ slug });
  }

  async findAll(skip: number = 0, limit: number = 10): Promise<ArticleDocument[]> {
    return this.articleModel.find().skip(skip).limit(limit).sort({ creationDate: -1 });
  }

  async findByTags(tags: string[], skip: number = 0, limit: number = 10): Promise<ArticleDocument[]> {
    return this.articleModel
      .find({ tags: { $in: tags } })
      .skip(skip)
      .limit(limit)
      .sort({ creationDate: -1 })
      .exec();
  }

  async findByPlanRole(planRole: string, skip: number = 0, limit: number = 10): Promise<ArticleDocument[]> {
    return this.articleModel
      .find({ planRole } as any)
      .skip(skip)
      .limit(limit)
      .sort({ creationDate: -1 })
      .exec();
  }

  async updateById(id: string, updateArticleDto: UpdateArticleDto): Promise<ArticleDocument | null> {
    return this.articleModel.findByIdAndUpdate(id, updateArticleDto, { new: true });
  }

  async deleteById(id: string): Promise<ArticleDocument | null> {
    return this.articleModel.findByIdAndDelete(id);
  }

  async countAll(): Promise<number> {
    return this.articleModel.countDocuments();
  }

  async incrementViewCount(id: string): Promise<ArticleDocument | null> {
    return this.articleModel.findByIdAndUpdate(id, { $inc: { viewsCount: 1 } }, { new: true });
  }

  async incrementLikeCount(id: string): Promise<ArticleDocument | null> {
    return this.articleModel.findByIdAndUpdate(id, { $inc: { likeCount: 1 } }, { new: true });
  }

  async decrementLikeCount(id: string): Promise<ArticleDocument | null> {
    return this.articleModel.findByIdAndUpdate(id, { $inc: { likeCount: -1 } }, { new: true });
  }

  async incrementCommentCount(id: string): Promise<ArticleDocument | null> {
    return this.articleModel.findByIdAndUpdate(id, { $inc: { commentCount: 1 } }, { new: true });
  }

  async decrementCommentCount(id: string): Promise<ArticleDocument | null> {
    return this.articleModel.findByIdAndUpdate(id, { $inc: { commentCount: -1 } }, { new: true });
  }
}
