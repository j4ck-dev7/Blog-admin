import { Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// @Schema({ timestamps: true }) // adiciona createdAt e updatedAt automaticamente
export class Article {
  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ required: true, unique: true, trim: true })
  slug!: string;

  // O 'timestamps: true' acima já cria creationDate (e updatedAt)
  // Se quiser o nome exato 'creationDate', pode sobrescrever as opções do mongoose
  @Prop({ default: Date.now })
  creationDate!: Date;

  @Prop({ required: true })
  author!: string;

  @Prop({ type: Array, required: true })
  content!: [];

  @Prop({ required: true })
  banner!: string;

  @Prop({
    type: String,
    enum: ['free', 'basic', 'intermediate', 'premium'],
    default: 'free',
    index: true,
  })
  planRole!: 'free' | 'basic' | 'intermediate' | 'premium';

  @Prop({ type: Number, default: 0 })
  viewsCount!: number;

  @Prop({ type: Number, default: 0 })
  likeCount!: number;

  @Prop({ type: Number, default: 0 })
  commentCount!: number;
}

export const ArticleSchema = SchemaFactory.createForClass(Article);

// --- Índices ---

// Índice de texto com pesos
ArticleSchema.index(
  {
    title: 'text',
    content: 'text', // Nota: Mongoose text index em arrays de subdocumentos pode precisar de configuração específica dependendo da versão
  },
  {
    weights: {
      title: 100,
      content: 60,
    },
    name: 'TextIndex',
  }
);

// Índices compostos
ArticleSchema.index({ title: 1, creationDate: -1 });

// Opcional: Adicionar método estático ou instância se necessário
// ArticleSchema.methods.incrementViews = function() { ... }

export type ArticleDocument = Article & Document;