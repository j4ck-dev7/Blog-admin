import { IsString, IsNotEmpty, IsArray, IsEnum, MinLength, MaxLength, Matches, ArrayNotEmpty, ValidateNested } from 'class-validator';
import { Transform } from 'class-transformer';
import { sanitize } from 'isomorphic-dompurify';

export class CreateArticleDto {
  @IsString()
  @IsNotEmpty({ message: 'Título é obrigatório' })
  @MinLength(5, { message: 'Título deve ter no mínimo 5 caracteres' })
  @MaxLength(200, { message: 'Título deve ter no máximo 200 caracteres' })
  @Transform(({ value }) => sanitize(value?.trim?.() || ''))
  title!: string;

  @IsString()
  @IsNotEmpty({ message: 'Slug é obrigatório' })
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug deve conter apenas letras minúsculas, números e hífens',
  })
  @Transform(({ value }) => value?.trim?.().toLowerCase() || '')
  slug!: string;

  @IsString()
  @IsNotEmpty({ message: 'Autor é obrigatório' })
  @MinLength(3, { message: 'Nome do autor deve ter no mínimo 3 caracteres' })
  @MaxLength(100, { message: 'Nome do autor deve ter no máximo 100 caracteres' })
  @Transform(({ value }) => sanitize(value?.trim?.() || ''))
  author!: string;

  @IsArray({ message: 'Conteúdo deve ser um array' })
  @ArrayNotEmpty({ message: 'Conteúdo não pode estar vazio' })
  @Transform(({ value }) => {
    if (!Array.isArray(value)) return [];
    return value.map((item: any) => (typeof item === 'string' ? sanitize(item) : item));
  })
  content!: unknown[];

  @IsString()
  @IsNotEmpty({ message: 'Banner é obrigatório' })
  @Matches(/^(https?:\/\/.+|\/[a-z0-9/_-]+\.(jpg|jpeg|png|gif|webp))$/i, {
    message: 'Banner deve ser uma URL válida ou caminho válido',
  })
  @Transform(({ value }) => value?.trim?.() || '')
  banner!: string;

  @IsArray()
  @ArrayNotEmpty({ message: 'Tags não podem estar vazias' })
  @Transform(({ value }) => {
    if (!Array.isArray(value)) return [];
    return value
      .map((tag: string) => sanitize(tag?.trim?.()?.toLowerCase() || ''))
      .filter((tag: string) => tag.length > 0 && tag.length <= 50);
  })
  tags!: string[];

  @IsEnum(['free', 'basic', 'intermediate', 'premium'], {
    message: 'Plano deve ser: free, basic, intermediate ou premium',
  })
  planRole?: 'free' | 'basic' | 'intermediate' | 'premium';
}
