import { Test, TestingModule } from '@nestjs/testing';
import { jest } from '@jest/globals';
import { ArticleController } from '../articles.controller.js';
import { ArticleService } from '../articles.service.js';
import { CreateArticleDto } from '../dtos/create-article.dto.js';
import { UpdateArticleDto } from '../dtos/update-article.dto.js';
import { NotFoundException } from '@nestjs/common';

describe('ArticleController', () => {
  let controller: ArticleController;
  let service: ArticleService;

  const mockArticle = {
    _id: '507f1f77bcf86cd799439011',
    title: 'Test Article',
    slug: 'test-article',
    author: 'Test Author',
    content: ['Content 1'],
    banner: 'https://example.com/banner.jpg',
    tags: ['test', 'article'],
    planRole: 'free' as const,
    creationDate: new Date(),
    viewsCount: 0,
    likeCount: 0,
    commentCount: 0,
  };

  const mockService = {
    create: jest.fn(),
    findById: jest.fn(),
    findBySlug: jest.fn(),
    findAll: jest.fn(),
    findByTags: jest.fn(),
    findByPlanRole: jest.fn(),
    updateById: jest.fn(),
    deleteById: jest.fn(),
    incrementViewCount: jest.fn(),
    incrementLikeCount: jest.fn(),
    decrementLikeCount: jest.fn(),
    incrementCommentCount: jest.fn(),
    decrementCommentCount: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ArticleController],
      providers: [
        {
          provide: ArticleService,
          useValue: mockService,
        },
        {
          provide: 'REDIS_CLIENT',
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<ArticleController>(ArticleController);
    service = module.get<ArticleService>(ArticleService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create an article', async () => {
      const createDto: CreateArticleDto = {
        title: 'Test Article',
        slug: 'test-article',
        author: 'Test Author',
        content: ['Content'],
        banner: 'https://example.com/banner.jpg',
        tags: ['test'],
      };

      mockService.create.mockImplementation(() => Promise.resolve(mockArticle));

      const result = await controller.create(createDto);

      expect(result).toEqual(mockArticle);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return paginated articles', async () => {
      const expected = {
        data: [mockArticle],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          pages: 1,
        },
      };

      mockService.findAll.mockImplementation(() => Promise.resolve(expected));   

      const result = await controller.findAll(1, 10);

      expect(result).toEqual(expected);
      expect(service.findAll).toHaveBeenCalledWith(1, 10);
    });

    it('should use default pagination values', async () => {
      const expected = {
        data: [],
        pagination: { page: 1, limit: 10, total: 0, pages: 0 },
      };

      mockService.findAll.mockImplementation(() => Promise.resolve(expected));

      await controller.findAll(undefined, undefined);

      expect(service.findAll).toHaveBeenCalledWith(undefined, undefined);
    });
  });

  describe('findById', () => {
    it('should return article by id', async () => {
      mockService.findById.mockImplementation(() => Promise.resolve(mockArticle));

      const result = await controller.findById('507f1f77bcf86cd799439011');

      expect(result).toEqual(mockArticle);
      expect(service.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });
  });

  describe('findByTags', () => {
    it('should return articles by tags', async () => {
      const expected = {
        data: [mockArticle],
        pagination: { page: 1, limit: 10, total: 1, pages: 1 },
      };

      mockService.findByTags.mockImplementation(() => Promise.resolve(expected));

      const result = await controller.findByTags('test,article', 1, 10);

      expect(result).toEqual(expected);
      expect(service.findByTags).toHaveBeenCalledWith(['test', 'article'], 1, 10);
    });

    it('should throw NotFoundException when tags query is missing', async () => {
      await expect(controller.findByTags(undefined, 1, 10)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByPlanRole', () => {
    it('should return articles by plan role', async () => {
      const expected = {
        data: [mockArticle],
        pagination: { page: 1, limit: 10, total: 1, pages: 1 },
      };

      mockService.findByPlanRole.mockImplementation(() => Promise.resolve(expected));

      const result = await controller.findByPlanRole('free', 1, 10);

      expect(result).toEqual(expected);
      expect(service.findByPlanRole).toHaveBeenCalledWith('free', 1, 10);
    });
  });

  describe('update', () => {
    it('should update an article', async () => {
      const updateDto: UpdateArticleDto = { title: 'Updated Title' };
      const updated = { ...mockArticle, ...updateDto };

      mockService.updateById.mockImplementation(() => Promise.resolve(updated));

      const result = await controller.update('507f1f77bcf86cd799439011', updateDto);

      expect(result).toEqual(updated);
      expect(service.updateById).toHaveBeenCalledWith('507f1f77bcf86cd799439011', updateDto);
    });
  });

  describe('delete', () => {
    it('should delete an article', async () => {
      mockService.deleteById.mockImplementation(() => Promise.resolve(mockArticle));

      const result = await controller.delete('507f1f77bcf86cd799439011');

      expect(result).toEqual(mockArticle);
      expect(service.deleteById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });
  });

  describe('counter operations', () => {
    const id = '507f1f77bcf86cd799439011';

    it('should increment view count', async () => {
      mockService.incrementViewCount.mockImplementation(() => Promise.resolve(undefined));

      const result = await controller.incrementViewCount(id);

      expect(result).toEqual({ message: 'Views incrementadas com sucesso' });
      expect(service.incrementViewCount).toHaveBeenCalledWith(id);
    });

    it('should increment like count', async () => {
      mockService.incrementLikeCount.mockImplementation(() => Promise.resolve(undefined));

      const result = await controller.incrementLikeCount(id);

      expect(result).toEqual({ message: 'Likes incrementados com sucesso' });
      expect(service.incrementLikeCount).toHaveBeenCalledWith(id);
    });

    it('should decrement like count', async () => {
      mockService.decrementLikeCount.mockImplementation(() => Promise.resolve(undefined));

      const result = await controller.decrementLikeCount(id);

      expect(result).toEqual({ message: 'Likes decrementados com sucesso' });
      expect(service.decrementLikeCount).toHaveBeenCalledWith(id);
    });

    it('should increment comment count', async () => {
      mockService.incrementCommentCount.mockImplementation(() => Promise.resolve(undefined));

      const result = await controller.incrementCommentCount(id);

      expect(result).toEqual({ message: 'Comentários incrementados com sucesso' });
      expect(service.incrementCommentCount).toHaveBeenCalledWith(id);
    });

    it('should decrement comment count', async () => {
      mockService.decrementCommentCount.mockImplementation(() => Promise.resolve(undefined));

      const result = await controller.decrementCommentCount(id);

      expect(result).toEqual({ message: 'Comentários decrementados com sucesso' });
      expect(service.decrementCommentCount).toHaveBeenCalledWith(id);
    });
  });
});
