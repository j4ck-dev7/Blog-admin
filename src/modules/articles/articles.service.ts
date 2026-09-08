import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { ArticleRepository } from '../../infrastructure/database/mongodb/repositories/article.repository';
import type { CreateArticleDto } from './dtos/create-article.dto';
import type { UpdateArticleDto } from './dtos/update-article.dto';
import { Article } from '../../domain/entities/article.entity';

interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

@Injectable()
export class ArticleService {
  private readonly logger = new Logger(ArticleService.name);

  constructor(private readonly articleRepository: ArticleRepository) {}

  /**
   * Criar um novo artigo
   * @param createArticleDto - Dados para criar o artigo
   * @returns Artigo criado
   */
  async create(createArticleDto: CreateArticleDto): Promise<void> {
    this.logger.log(`Criando novo artigo: ${createArticleDto.title}`);

    // Verificar se slug já existe
    const existingArticle = await this.articleRepository.findBySlug(
      createArticleDto.slug,
    );
    if (existingArticle) {
      this.logger.warn(`Slug já existe: ${createArticleDto.slug}`);
      throw new ConflictException(
        `Slug '${createArticleDto.slug}' já está em uso`,
      );
    }

    try {
      const article =
        await this.articleRepository.createArticle(createArticleDto);
      this.logger.log(`Artigo criado com sucesso: ${article}`);
    } catch (error) {
      this.logger.error(`Erro ao criar artigo: ${(error as Error).message}`);
      throw new BadRequestException(
        `Erro ao criar artigo: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Buscar artigo por ID
   * @param id - ID do artigo
   * @returns Artigo encontrado
   */
  async findById(id: string): Promise<Article | null> {
    this.logger.log(`Buscando artigo por ID: ${id}`);

    const article = await this.articleRepository.findById(id);
    if (!article) {
      this.logger.warn(`Artigo não encontrado: ${id}`);
      throw new NotFoundException(`Artigo com ID '${id}' não encontrado`);
    }

    return article;
  }

  /**
   * Buscar artigo por slug
   * @param slug - Slug do artigo
   * @returns Artigo encontrado
   */
  // async findBySlug(slug: string): Promise<Article | null> {
  //   this.logger.log(`Buscando artigo por slug: ${slug}`);

  //   const article = await this.articleRepository.findBySlug(slug);
  //   if (!article) {
  //     this.logger.warn(`Artigo não encontrado com slug: ${slug}`);
  //     throw new NotFoundException(`Artigo com slug '${slug}' não encontrado`);
  //   }

  //   return article;
  // }

  /**
   * Listar todos os artigos com paginação
   * @param page - Página (começa em 1)
   * @param limit - Itens por página
   * @returns Array de artigos
   */
  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedResult<Article>> {
    this.logger.log(`Listando artigos: página ${page}, limite ${limit}`);

    if (page < 1) page = 1;
    if (limit < 1) limit = 10;
    if (limit > 100) limit = 100; // Máximo 100 por página

    const skip = (page - 1) * limit;
    const articles = await this.articleRepository.allArticles(skip, limit);
    const total = articles.length;

    return {
      data: articles,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Buscar artigos por tags
   * @param tags - Array de tags para filtro
   * @param page - Página (começa em 1)
   * @param limit - Itens por página
   * @returns Array de artigos e informações de paginação
   */
  // async findByTags(
  //   tags: string[],
  //   page: number = 1,
  //   limit: number = 10,
  // ): Promise<PaginatedResult<ArticleDocument>> {
  //   this.logger.log(`Buscando artigos por tags: ${tags.join(', ')}`);

  //   if (!Array.isArray(tags) || tags.length === 0) {
  //     throw new BadRequestException('Tags devem ser um array não vazio');
  //   }

  //   if (page < 1) page = 1;
  //   if (limit < 1) limit = 10;
  //   if (limit > 100) limit = 100;

  //   const skip = (page - 1) * limit;
  //   const articles = await this.articleRepository.findByTags(tags, skip, limit);
  //   const total = articles.length;

  //   return {
  //     data: articles,
  //     pagination: {
  //       page,
  //       limit,
  //       total,
  //       pages: Math.ceil(total / limit),
  //     },
  //   };
  // }

  /**
   * Buscar artigos por plano
   * @param planRole - Plano do artigo
   * @param page - Página (começa em 1)
   * @param limit - Itens por página
   * @returns Array de artigos e informações de paginação
   */
  // async findByPlanRole(
  //   planRole: 'free' | 'basic' | 'intermediate' | 'premium',
  //   page: number = 1,
  //   limit: number = 10,
  // ): Promise<PaginatedResult<ArticleDocument>> {
  //   const validPlans: ('free' | 'basic' | 'intermediate' | 'premium')[] = [
  //     'free',
  //     'basic',
  //     'intermediate',
  //     'premium',
  //   ];
  //   if (!validPlans.includes(planRole)) {
  //     throw new BadRequestException(
  //       `Plano inválido. Deve ser um dos: ${validPlans.join(', ')}`,
  //     );
  //   }

  //   this.logger.log(`Buscando artigos por plano: ${planRole}`);

  //   if (page < 1) page = 1;
  //   if (limit < 1) limit = 10;
  //   if (limit > 100) limit = 100;

  //   const skip = (page - 1) * limit;
  //   const articles = await this.articleRepository.findByPlanRole(
  //     planRole,
  //     skip,
  //     limit,
  //   );
  //   const total = articles.length;

  //   return {
  //     data: articles,
  //     pagination: {
  //       page,
  //       limit,
  //       total,
  //       pages: Math.ceil(total / limit),
  //     },
  //   };
  // }

  /**
   * Atualizar artigo por ID
   * @param id - ID do artigo
   * @param updateArticleDto - Dados a atualizar
   * @returns Artigo atualizado
   */
  async updateById(
    id: string,
    updateArticleDto: UpdateArticleDto,
  ): Promise<Article> {
    this.logger.log(`Atualizando artigo: ${id}`);

    // Verificar se artigo existe
    const existingArticle = await this.articleRepository.findById(id);
    if (!existingArticle) {
      this.logger.warn(`Artigo não encontrado para atualização: ${id}`);
      throw new NotFoundException(`Artigo com ID '${id}' não encontrado`);
    }

    // Se slug está sendo atualizado, verificar conflito
    if (updateArticleDto.slug) {
      const slugConflict: string | null =
        await this.articleRepository.verifyBySlug(updateArticleDto.slug);
      if (slugConflict && slugConflict !== id) {
        this.logger.warn(
          `Slug conflita com outro artigo: ${updateArticleDto.slug}`,
        );
        throw new ConflictException(
          `Slug '${updateArticleDto.slug}' já está em uso`,
        );
      }
    }

    try {
      const updatedArticle = await this.articleRepository.editArticle(
        id,
        updateArticleDto,
      );
      if (!updatedArticle) {
        throw new NotFoundException(`Artigo com ID '${id}' não encontrado`);
      }
      this.logger.log(`Artigo atualizado com sucesso: ${id}`);
      return updatedArticle;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      this.logger.error(
        `Erro ao atualizar artigo: ${(error as Error).message}`,
      );
      throw new BadRequestException(
        `Erro ao atualizar artigo: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Deletar artigo por ID
   * @param id - ID do artigo
   * @returns Artigo deletado
   */
  async deleteById(id: string): Promise<void> {
    this.logger.log(`Deletando artigo: ${id}`);

    const article = await this.articleRepository.findById(id);
    if (!article) {
      this.logger.warn(`Artigo não encontrado para deleção: ${id}`);
      throw new NotFoundException(`Artigo com ID '${id}' não encontrado`);
    }

    try {
      const deletedArticle = await this.articleRepository.deleteArticle(id);
      if (!deletedArticle) {
        throw new NotFoundException(`Artigo com ID '${id}' não encontrado`);
      }
      this.logger.log(`Artigo deletado com sucesso: ${id}`);
    } catch (error) {
      this.logger.error(`Erro ao deletar artigo: ${(error as Error).message}`);
      throw new BadRequestException(
        `Erro ao deletar artigo: ${(error as Error).message}`,
      );
    }
  }
}
