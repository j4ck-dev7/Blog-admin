import { jest } from '@jest/globals';

jest.mock('isomorphic-dompurify', () => ({
  sanitize: (value: string) => value,
}));

import { ArticleController } from '../articles.controller';

describe('ArticleController', () => {
  let controller: ArticleController;
  let service: any;

  beforeEach(() => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      updateById: jest.fn(),
      deleteById: jest.fn(),
    };
    controller = new ArticleController(service as any);
  });

  it('delegates create to the service', async () => {
    const dto = { title: 'Um artigo válido' };
    service.create.mockResolvedValue(undefined);

    await expect(controller.create(dto as any)).resolves.toBeUndefined();
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('delegates findAll with pagination parameters', async () => {
    const result = {
      data: [],
      pagination: { page: 1, limit: 10, total: 0, pages: 0 },
    };
    service.findAll.mockResolvedValue(result);

    await expect(controller.findAll(2, 5)).resolves.toBe(result);
    expect(service.findAll).toHaveBeenCalledWith(2, 5);
  });

  it('delegates findById', async () => {
    service.findById.mockResolvedValue({ _id: 'article-1' });

    await expect(controller.findById('article-1')).resolves.toEqual({
      _id: 'article-1',
    });
    expect(service.findById).toHaveBeenCalledWith('article-1');
  });

  it('delegates update and delete with the route id', async () => {
    const dto = { title: 'Título atualizado' };
    service.updateById.mockResolvedValue({ _id: 'article-1', ...dto });
    service.deleteById.mockResolvedValue(undefined);

    await expect(controller.update('article-1', dto as any)).resolves.toEqual({
      _id: 'article-1',
      ...dto,
    });
    await expect(controller.delete('article-1')).resolves.toBeUndefined();

    expect(service.updateById).toHaveBeenCalledWith('article-1', dto);
    expect(service.deleteById).toHaveBeenCalledWith('article-1');
  });
});
