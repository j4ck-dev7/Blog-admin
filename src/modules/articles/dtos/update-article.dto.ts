import { IsString, IsArray, IsEnum, MinLength, MaxLength, Matches, ArrayNotEmpty, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { sanitize } from 'isomorphic-dompurify';

export class UpdateArticleDto {
  @IsOptional()
  @IsString()
  @MinLength(5, { message: 'Título deve ter no mínimo 5 caracteres' })
  @MaxLength(200, { message: 'Título deve ter no máximo 200 caracteres' })
  @Transform(({ value }) => (value ? sanitize(value?.trim?.() || '') : undefined))
  title?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug deve conter apenas letras minúsculas, números e hífens',
  })
  @Transform(({ value }) => (value ? value?.trim?.().toLowerCase() || '' : undefined))
  slug?: string;

  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Nome do autor deve ter no mínimo 3 caracteres' })
  @MaxLength(100, { message: 'Nome do autor deve ter no máximo 100 caracteres' })
  @Transform(({ value }) => (value ? sanitize(value?.trim?.() || '') : undefined))
  author?: string;

  @IsOptional()
  @IsArray({ message: 'Conteúdo deve ser um array' })
  @ArrayNotEmpty({ message: 'Conteúdo não pode estar vazio' })
  @Transform(({ value }) => {
    if (!value) return undefined;
    if (!Array.isArray(value)) return [];
    return value.map((item: any) => (typeof item === 'string' ? sanitize(item) : item));
  })
  content?: unknown[];

  @IsOptional()
  @IsString()
  @Matches(/^(https?:\/\/.+|\/[a-z0-9/_-]+\.(jpg|jpeg|png|gif|webp))$/i, {
    message: 'Banner deve ser uma URL válida ou caminho válido',
  })
  @Transform(({ value }) => (value ? value?.trim?.() || '' : undefined))
  banner?: string;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty({ message: 'Tags não podem estar vazias' })
  @Transform(({ value }) => {
    if (!value) return undefined;
    if (!Array.isArray(value)) return [];
    return value
      .map((tag: string) => sanitize(tag?.trim?.()?.toLowerCase() || ''))
      .filter((tag: string) => tag.length > 0 && tag.length <= 50);
  })
  tags?: string[];

  @IsOptional()
  @IsEnum(['free', 'basic', 'intermediate', 'premium'], {
    message: 'Plano deve ser: free, basic, intermediate ou premium',
  })
  planRole?: 'free' | 'basic' | 'intermediate' | 'premium';
}
