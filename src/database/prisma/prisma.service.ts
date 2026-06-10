// src/prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../../../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService 
  extends PrismaClient 
  implements OnModuleInit, OnModuleDestroy 
{
  constructor(private configService: ConfigService) {
    const connectionString = configService.get<string>('POSTGRES_URL');
    const adapter = new PrismaPg({ connectionString });
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();     // Conecta no banco quando o módulo inicia
  }

  async onModuleDestroy() {
    await this.$disconnect();  // Desconecta quando o módulo é destruído
  }
}