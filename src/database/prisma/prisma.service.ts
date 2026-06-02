// src/prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../../../generated/prisma/client.js';

@Injectable()
export class PrismaService 
  extends PrismaClient 
  implements OnModuleInit, OnModuleDestroy 
{
  async onModuleInit() {
    await this.$connect();     // Conecta no banco quando o módulo inicia
  }

  async onModuleDestroy() {
    await this.$disconnect();  // Desconecta quando o módulo é destruído
  }
}