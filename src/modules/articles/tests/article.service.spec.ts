import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { jest } from '@jest/globals';
import { ArticleService } from '../articles.service';

describe('ArticleService', () => {
  let service: ArticleService;
  let repository: any;

  const article = {
    _id: 'article-1',
    title: 'Um artigo válido',
    slug: 'um-artigo-valido',
    author: 'Autor',
    content: [{ type: 'paragraph' as const, text: 'Conteúdo' }],
  };

  beforeEach(() => {
    repository = {
      findBySlug: jest.fn(),
      createArticle: jest.fn(),
      findById: jest.fn(),
      allArticles: jest.fn(),
      verifyBySlug: jest.fn(),
      editArticle: jest.fn(),
      deleteArticle: jest.fn(),
    };
    service = new ArticleService(repository as any);
  });

  it('creates an article when the slug is available', async () => {
    repository.findBySlug.mockResolvedValue(false);
    repository.createArticle.mockResolvedValue('article-1');

    await expect(service.create(article as any)).resolves.toBeUndefined();
    expect(repository.createArticle).toHaveBeenCalledWith(article);
  });

  it('throws ConflictException when creating a duplicated slug', async () => {
    repository.findBySlug.mockResolvedValue(true);

    await expect(service.create(article as any)).rejects.toThrow(
      ConflictException,
    );
    expect(repository.createArticle).not.toHaveBeenCalled();
  });

  it('translates repository errors while creating', async () => {
    repository.findBySlug.mockResolvedValue(false);
    repository.createArticle.mockRejectedValue(new Error('database offline'));

    await expect(service.create(article as any)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('finds an article by id', async () => {
    repository.findById.mockResolvedValue(article);

    await expect(service.findById('article-1')).resolves.toBe(article);
  });

  it('throws NotFoundException when the article does not exist', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(service.findById('missing')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('returns paginated articles and passes the calculated skip', async () => {
    const articles = [article, { ...article, _id: 'article-2' }];
    repository.allArticles.mockResolvedValue(articles);

    await expect(service.findAll(2, 5)).resolves.toEqual({
      data: articles,
      pagination: { page: 2, limit: 5, total: 2, pages: 1 },
    });
    expect(repository.allArticles).toHaveBeenCalledWith(5, 5);
  });

  it('normalizes invalid pagination values', async () => {
    repository.allArticles.mockResolvedValue([]);

    await service.findAll(0, 200);

    expect(repository.allArticles).toHaveBeenCalledWith(0, 100);
  });

  it('updates an article without a slug conflict', async () => {
    const update = { title: 'Título atualizado' };
    repository.findById.mockResolvedValue(article);
    repository.editArticle.mockResolvedValue({ ...article, ...update });

    await expect(service.updateById('article-1', update)).resolves.toEqual({
      ...article,
      ...update,
    });
    expect(repository.verifyBySlug).not.toHaveBeenCalled();
  });

  it('throws ConflictException when updating to another article slug', async () => {
    repository.findById.mockResolvedValue(article);
    repository.verifyBySlug.mockResolvedValue('article-2');

    await expect(
      service.updateById('article-1', { slug: 'slug-ocupado' }),
    ).rejects.toThrow(ConflictException);
    expect(repository.editArticle).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when updating a missing article', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(service.updateById('missing', {})).rejects.toThrow(
      NotFoundException,
    );
  });

  it('translates repository errors while updating', async () => {
    repository.findById.mockResolvedValue(article);
    repository.editArticle.mockRejectedValue(new Error('database offline'));

    await expect(service.updateById('article-1', {})).rejects.toThrow(
      BadRequestException,
    );
  });

  it('deletes an existing article', async () => {
    repository.findById.mockResolvedValue(article);
    repository.deleteArticle.mockResolvedValue(article);

    await expect(service.deleteById('article-1')).resolves.toBeUndefined();
    expect(repository.deleteArticle).toHaveBeenCalledWith('article-1');
  });

  it('throws NotFoundException when deleting a missing article', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(service.deleteById('missing')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('translates repository errors while deleting', async () => {
    repository.findById.mockResolvedValue(article);
    repository.deleteArticle.mockRejectedValue(new Error('database offline'));

    await expect(service.deleteById('article-1')).rejects.toThrow(
      BadRequestException,
    );
  });
});
