import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import request from 'supertest';
import { RateLimitGuard } from '../src/modules/articles/guards/rate-limit.guard';
import { AdminAuthGuard } from '../src/common/guards/admin-auth.guard';
import { Article } from '../src/modules/articles/schemas/article.schema';
import { AppModule } from '../src/app.module';
import { afterAll, beforeAll, describe, it, expect } from '@jest/globals';
import { startInMemoryMongo, stopInMemoryMongo } from './setup';

describe('Articles (e2e)', () => {
  let app: INestApplication;
  let createdArticleId: string;
  let articleModel: Model<Article>;

  beforeAll(async () => {
    await startInMemoryMongo();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(AdminAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RateLimitGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    articleModel = moduleFixture.get<Model<Article>>(getModelToken('Article'));
    await app.init();
    
    // Clear any existing articles
    await articleModel.deleteMany({});
  });

  afterAll(async () => {
    await app.close();
    await stopInMemoryMongo();
  });

  it('should create an article (POST /articles/create)', async () => {
    const payload = { 
      title: 'New Article', 
      slug: 'new-article', 
      content: ['Content paragraph 1'],
      author: 'Test Author',
      banner: 'https://example.com/banner.jpg',
      tags: ['test', 'article']
    };
    
    const res = await request(app.getHttpServer())
      .post('/articles/create')
      .send(payload);
    
    if (res.status !== 201) {
      console.error('Create article failed:', res.status, res.body);
    }
    
    expect(res.status).toBe(201);
    
    // Store the created article ID for subsequent tests
    createdArticleId = res.body._id || res.body.id;
    expect(createdArticleId).toBeDefined();
  });

  it('should list articles (GET /articles)', async () => {
    const res = await request(app.getHttpServer())
      .get('/articles')
      .expect(200);
    
    // Response might be an array or an object with data property
    const articles = Array.isArray(res.body) ? res.body : res.body.data || res.body.articles || [];
    expect(articles.length).toBeGreaterThan(0);
  });

  it('should get an article by id (GET /articles/:id)', async () => {
    if (!createdArticleId) {
      throw new Error('No article created to test with');
    }
    const res = await request(app.getHttpServer())
      .get(`/articles/${createdArticleId}`)
      .expect(200);
    
    expect(res.body._id || res.body.id).toBe(createdArticleId);
  });

  it('should update an article by id (PUT /articles/:id)', async () => {
    if (!createdArticleId) {
      throw new Error('No article created to test with');
    }
    const res = await request(app.getHttpServer())
      .put(`/articles/${createdArticleId}`)
      .send({ title: 'Updated Title' })
      .expect(200);
    
    // Response might have the updated article or just success status
    expect(res.status).toBe(200);
  });

  it('should delete an article by id (DELETE /articles/:id)', async () => {
    if (!createdArticleId) {
      throw new Error('No article created to test with');
    }
    const res = await request(app.getHttpServer())
      .delete(`/articles/${createdArticleId}`)
      .expect(200);
    
    // Response might have success property or just status
    expect(res.status).toBe(200);
  });
});