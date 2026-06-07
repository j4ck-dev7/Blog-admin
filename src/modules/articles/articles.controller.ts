import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  ValidationPipe,
  Query,
  Logger,
  NotFoundException,
  ParseIntPipe,
} from '@nestjs/common';
import { ArticleService } from './articles.service';
import { CreateArticleDto } from './dtos/create-article.dto';
import { UpdateArticleDto } from './dtos/update-article.dto';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { RateLimitGuard } from './guards/rate-limit.guard';

@Controller('articles')
@UseGuards(RateLimitGuard)
export class ArticleController {
  private readonly logger = new Logger(ArticleController.name);

  constructor(private readonly articleService: ArticleService) {}

  /**
   * POST /articles
   * Criar um novo artigo
   * Requer: Admin, Rate Limit
   */
  @Post('/create')
  @UseGuards(AdminAuthGuard)
  async create(@Body(new ValidationPipe({ transform: true })) createArticleDto: CreateArticleDto) {
    this.logger.log(`[POST] Criando novo artigo: ${createArticleDto.title}`);
    return this.articleService.create(createArticleDto);
  }

  /**
   * GET /articles
   * Listar todos os artigos com paginação
   */
  @Get()
  async findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    this.logger.log(`[GET] Listando artigos: página ${page || 1}, limite ${limit || 10}`);
    return this.articleService.findAll(page, limit);
  }

  /**
   * GET /articles/tags
   * Buscar artigos por tags
   */
  @Get('tags')
  async findByTags(
    @Query('tags') tagsQuery?: string,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    if (!tagsQuery) {
      throw new NotFoundException('Parâmetro "tags" é obrigatório (separado por vírgula)');
    }
    const tags = tagsQuery
      .split(',')
      .map((tag) => tag.trim().toLowerCase())
      .filter((tag) => tag.length > 0);

    this.logger.log(`[GET] Buscando artigos por tags: ${tags.join(', ')}`);
    return this.articleService.findByTags(tags, page, limit);
  }

  /**
   * GET /articles/plan/:planRole
   * Buscar artigos por plano
   */
  @Get('plan/:planRole')
  async findByPlanRole(
    @Param('planRole') planRole: string,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    this.logger.log(`[GET] Buscando artigos por plano: ${planRole}`);
    return this.articleService.findByPlanRole(planRole, page, limit);
  }

  /**
   * GET /articles/:id
   * Buscar artigo por ID
   */
  @Get(':id')
  async findById(@Param('id') id: string) {
    this.logger.log(`[GET] Buscando artigo por ID: ${id}`);
    return this.articleService.findById(id);
  }

  /**
   * PUT /articles/:id
   * Atualizar artigo por ID
   * Requer: Admin, Rate Limit
   */
  @Put(':id')
  @UseGuards(AdminAuthGuard)
  async update(
    @Param('id') id: string,
    @Body(new ValidationPipe({ transform: true, skipMissingProperties: true }))
    updateArticleDto: UpdateArticleDto,
  ) {
    this.logger.log(`[PUT] Atualizando artigo: ${id}`);
    return this.articleService.updateById(id, updateArticleDto);
  }

  /**
   * DELETE /articles/:id
   * Deletar artigo por ID
   * Requer: Admin, Rate Limit
   */
  @Delete(':id')
  @UseGuards(AdminAuthGuard)
  async delete(@Param('id') id: string) {
    this.logger.log(`[DELETE] Deletando artigo: ${id}`);
    return this.articleService.deleteById(id);
  }

  /**
   * POST /articles/:id/increment-views
   * Incrementar contador de visualizações
   */
  @Post(':id/increment-views')
  async incrementViewCount(@Param('id') id: string) {
    this.logger.log(`[POST] Incrementando views do artigo: ${id}`);
    await this.articleService.incrementViewCount(id);
    return { message: 'Views incrementadas com sucesso' };
  }

  /**
   * POST /articles/:id/increment-likes
   * Incrementar contador de likes
   */
  @Post(':id/increment-likes')
  async incrementLikeCount(@Param('id') id: string) {
    this.logger.log(`[POST] Incrementando likes do artigo: ${id}`);
    await this.articleService.incrementLikeCount(id);
    return { message: 'Likes incrementados com sucesso' };
  }

  /**
   * POST /articles/:id/decrement-likes
   * Decrementar contador de likes
   */
  @Post(':id/decrement-likes')
  async decrementLikeCount(@Param('id') id: string) {
    this.logger.log(`[POST] Decrementando likes do artigo: ${id}`);
    await this.articleService.decrementLikeCount(id);
    return { message: 'Likes decrementados com sucesso' };
  }

  /**
   * POST /articles/:id/increment-comments
   * Incrementar contador de comentários
   */
  @Post(':id/increment-comments')
  async incrementCommentCount(@Param('id') id: string) {
    this.logger.log(`[POST] Incrementando comentários do artigo: ${id}`);
    await this.articleService.incrementCommentCount(id);
    return { message: 'Comentários incrementados com sucesso' };
  }

  /**
   * POST /articles/:id/decrement-comments
   * Decrementar contador de comentários
   */
  @Post(':id/decrement-comments')
  async decrementCommentCount(@Param('id') id: string) {
    this.logger.log(`[POST] Decrementando comentários do artigo: ${id}`);
    await this.articleService.decrementCommentCount(id);
    return { message: 'Comentários decrementados com sucesso' };
  }
}
