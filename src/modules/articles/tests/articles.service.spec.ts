import { Test, TestingModule } from '@nestjs/testing';
import { jest } from '@jest/globals';
import { ArticleService } from '../articles.service';
import { ArticleRepository } from '../articles.repository';
import { CreateArticleDto } from '../dtos/create-article.dto';
import { UpdateArticleDto } from '../dtos/update-article.dto';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';

describe('ArticleService', () => {
  let service: ArticleService;
  let repository: ArticleRepository;

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

  const mockRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    findBySlug: jest.fn(),
    findAll: jest.fn(),
    findByTags: jest.fn(),
    findByPlanRole: jest.fn(),
    updateById: jest.fn(),
    deleteById: jest.fn(),
    countAll: jest.fn(),
    incrementViewCount: jest.fn(),
    incrementLikeCount: jest.fn(),
    decrementLikeCount: jest.fn(),
    incrementCommentCount: jest.fn(),
    decrementCommentCount: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticleService,
        {
          provide: ArticleRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ArticleService>(ArticleService);
    repository = module.get<ArticleRepository>(ArticleRepository);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create an article successfully', async () => {
      const createDto: CreateArticleDto = {
        title: 'Test Article',
        slug: 'test-article',
        author: 'Test Author',
        content: ['Content 1'],
        banner: 'https://example.com/banner.jpg',
        tags: ['test'],
        planRole: 'free',
      };

      mockRepository.findBySlug.mockImplementation(() => Promise.resolve(null));
      mockRepository.create.mockImplementation(() => Promise.resolve(mockArticle));

      const result = await service.create(createDto);

      expect(result).toEqual(mockArticle);
      expect(mockRepository.findBySlug).toHaveBeenCalledWith(createDto.slug);
      expect(mockRepository.create).toHaveBeenCalledWith(createDto);
    });

    it('should throw ConflictException when slug already exists', async () => {
      const createDto: CreateArticleDto = {
        title: 'Test Article',
        slug: 'test-article',
        author: 'Test Author',
        content: ['Content 1'],
        banner: 'https://example.com/banner.jpg',
        tags: ['test'],
      };

      mockRepository.findBySlug.mockImplementation(() => Promise.resolve(mockArticle));

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
      expect(mockRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return article by id', async () => {
      const id = '507f1f77bcf86cd799439011';
      mockRepository.findById.mockImplementation(() => Promise.resolve(mockArticle));

      const result = await service.findById(id);

      expect(result).toEqual(mockArticle);
      expect(mockRepository.findById).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundException when article does not exist', async () => {
      const id = '507f1f77bcf86cd799439012';
      mockRepository.findById.mockImplementation(() => Promise.resolve(null));

      await expect(service.findById(id)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findBySlug', () => {
    it('should return article by slug', async () => {
      const slug = 'test-article';
      mockRepository.findBySlug.mockImplementation(() => Promise.resolve(mockArticle));

      const result = await service.findBySlug(slug);

      expect(result).toEqual(mockArticle);
      expect(mockRepository.findBySlug).toHaveBeenCalledWith(slug);
    });

    it('should throw NotFoundException when article does not exist', async () => {
      const slug = 'non-existent';
      mockRepository.findBySlug.mockImplementation(() => Promise.resolve(null));

      await expect(service.findBySlug(slug)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return paginated articles', async () => {
      const articles = [mockArticle];
      mockRepository.findAll.mockImplementation(() => Promise.resolve(articles));
      mockRepository.countAll.mockImplementation(() => Promise.resolve(1));

      const result = await service.findAll(1, 10);

      expect(result.data).toEqual(articles);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.total).toBe(1);
    });

    it('should enforce maximum limit of 100', async () => {
      mockRepository.findAll.mockImplementation(() => Promise.resolve([]));
      mockRepository.countAll.mockImplementation(() => Promise.resolve(0));

      await service.findAll(1, 200);

      expect(mockRepository.findAll).toHaveBeenCalledWith(0, 100);
    });
  });

  describe('updateById', () => {
    it('should update article successfully', async () => {
      const id = '507f1f77bcf86cd799439011';
      const updateDto: UpdateArticleDto = { title: 'Updated Title' };
      const updatedArticle = { ...mockArticle, ...updateDto };

      mockRepository.findById.mockImplementation(() => Promise.resolve(mockArticle));
      mockRepository.updateById.mockImplementation(() => Promise.resolve(updatedArticle));

      const result = await service.updateById(id, updateDto);

      expect(result).toEqual(updatedArticle);
      expect(mockRepository.updateById).toHaveBeenCalledWith(id, updateDto);
    });

    it('should throw NotFoundException when article does not exist', async () => {
      const id = '507f1f77bcf86cd799439012';
      const updateDto: UpdateArticleDto = { title: 'Updated' };

      mockRepository.findById.mockImplementation(() => Promise.resolve(null));

      await expect(service.updateById(id, updateDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when updating to existing slug', async () => {
      const id = '507f1f77bcf86cd799439011';
      const updateDto: UpdateArticleDto = { slug: 'existing-slug' };
      const existingArticle = { ...mockArticle, _id: '507f1f77bcf86cd799439012' };

      mockRepository.findById.mockImplementation(() => Promise.resolve(mockArticle));
      mockRepository.findBySlug.mockImplementation(() => Promise.resolve(existingArticle));

      await expect(service.updateById(id, updateDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('deleteById', () => {
    it('should delete article successfully', async () => {
      const id = '507f1f77bcf86cd799439011';

      mockRepository.findById.mockImplementation(() => Promise.resolve(mockArticle));
      mockRepository.deleteById.mockImplementation(() => Promise.resolve(mockArticle));

      const result = await service.deleteById(id);

      expect(result).toEqual(mockArticle);
      expect(mockRepository.deleteById).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundException when article does not exist', async () => {
      const id = '507f1f77bcf86cd799439012';

      mockRepository.findById.mockImplementation(() => Promise.resolve(null));

      await expect(service.deleteById(id)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByTags', () => {
    it('should return articles filtered by tags', async () => {
      const tags = ['test'];
      mockRepository.findByTags.mockImplementation(() => Promise.resolve([mockArticle]));

      const result = await service.findByTags(tags);

      expect(result.data).toEqual([mockArticle]);
      expect(mockRepository.findByTags).toHaveBeenCalledWith(tags, 0, 10);
    });

    it('should throw BadRequestException when tags array is empty', async () => {
      const tags: string[] = [];

      await expect(service.findByTags(tags)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findByPlanRole', () => {
    it('should return articles filtered by plan role', async () => {
      const planRole = 'free';
      mockRepository.findByPlanRole.mockImplementation(() => Promise.resolve([mockArticle]));

      const result = await service.findByPlanRole(planRole);

      expect(result.data).toEqual([mockArticle]);
      expect(mockRepository.findByPlanRole).toHaveBeenCalledWith(planRole, 0, 10);
    });

    it('should throw BadRequestException for invalid plan role', async () => {
      const invalidPlan = 'invalid-plan';

      await expect(service.findByPlanRole(invalidPlan)).rejects.toThrow(BadRequestException);
    });
  });

  describe('counter operations', () => {
    const id = '507f1f77bcf86cd799439011';

    it('should increment view count', async () => {
      await service.incrementViewCount(id);
      expect(mockRepository.incrementViewCount).toHaveBeenCalledWith(id);
    });

    it('should increment like count', async () => {
      await service.incrementLikeCount(id);
      expect(mockRepository.incrementLikeCount).toHaveBeenCalledWith(id);
    });

    it('should decrement like count', async () => {
      await service.decrementLikeCount(id);
      expect(mockRepository.decrementLikeCount).toHaveBeenCalledWith(id);
    });

    it('should increment comment count', async () => {
      await service.incrementCommentCount(id);
      expect(mockRepository.incrementCommentCount).toHaveBeenCalledWith(id);
    });

    it('should decrement comment count', async () => {
      await service.decrementCommentCount(id);
      expect(mockRepository.decrementCommentCount).toHaveBeenCalledWith(id);
    });
  });
});
