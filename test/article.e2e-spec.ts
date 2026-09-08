import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

jest.mock('isomorphic-dompurify', () => ({
  sanitize: (value: string) => value,
}));

import { ArticleController } from '../src/modules/articles/articles.controller';
import { ArticleService } from '../src/modules/articles/articles.service';
import { AdminAuthGuard } from '../src/common/guards/admin-auth.guard';
import { RateLimitGuard } from '../src/modules/articles/guards/rate-limit.guard';

describe('ArticlesController (e2e)', () => {
  let app: INestApplication<App>;
  let articleService: any;

  beforeEach(async () => {
    articleService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      updateById: jest.fn(),
      deleteById: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ArticleController],
      providers: [
        { provide: ArticleService, useValue: articleService },
        { provide: AdminAuthGuard, useValue: { canActivate: () => true } },
        { provide: RateLimitGuard, useValue: { canActivate: () => true } },
      ],
    })
      .overrideGuard(AdminAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RateLimitGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('lists articles', async () => {
    const result = {
      data: [{ _id: 'article-1', title: 'Um artigo válido' }],
      pagination: { page: 1, limit: 10, total: 1, pages: 1 },
    };
    articleService.findAll.mockResolvedValue(result);

    const response = await request(app.getHttpServer()).get(
      '/articles?page=1&limit=10',
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual(result);
    expect(articleService.findAll).toHaveBeenCalledWith(1, 10);
  });

  it('returns an article by id', async () => {
    const article = { _id: 'article-1', title: 'Um artigo válido' };
    articleService.findById.mockResolvedValue(article);

    const response = await request(app.getHttpServer()).get(
      '/articles/article-1',
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual(article);
  });

  it('creates an article through the HTTP endpoint', async () => {
    articleService.create.mockResolvedValue(undefined);

    const response = await request(app.getHttpServer())
      .post('/articles/create')
      .send({
        title: 'Um artigo válido',
        slug: 'um-artigo-valido',
        author: 'Autor',
        content: [{ type: 'paragraph', text: 'Conteúdo' }],
        banner: 'https://example.com/banner.jpg',
        tags: ['nestjs'],
        planRole: 'free',
      });

    expect(response.status).toBe(201);
    expect(articleService.create).toHaveBeenCalledTimes(1);
    expect(articleService.create.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        title: 'Um artigo válido',
        slug: 'um-artigo-valido',
        author: 'Autor',
      }),
    );
  });

  it('rejects invalid article data', async () => {
    const response = await request(app.getHttpServer())
      .post('/articles/create')
      .send({ title: 'curto' });

    expect(response.status).toBe(400);
    expect(articleService.create).not.toHaveBeenCalled();
  });

  it('updates and deletes an article through HTTP endpoints', async () => {
    const updated = { _id: 'article-1', title: 'Título atualizado' };
    articleService.updateById.mockResolvedValue(updated);
    articleService.deleteById.mockResolvedValue(undefined);

    const updateResponse = await request(app.getHttpServer())
      .put('/articles/article-1')
      .send({ title: 'Título atualizado' });
    const deleteResponse = await request(app.getHttpServer()).delete(
      '/articles/article-1',
    );

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body).toEqual(updated);
    expect(deleteResponse.status).toBe(200);
    expect(articleService.updateById).toHaveBeenCalledWith('article-1', {
      title: 'Título atualizado',
    });
    expect(articleService.deleteById).toHaveBeenCalledWith('article-1');
  });
});
