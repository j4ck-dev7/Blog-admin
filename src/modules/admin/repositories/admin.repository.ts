import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { IAdminRepository } from './admin.repository.interface';
import type { User, Prisma } from '../../../generated/prisma/client';

@Injectable()
export class AdminRepository implements IAdminRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({
      data,
    }) as unknown as Promise<User>;
  }

  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    }) as unknown as Promise<User[]>;
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    }) as unknown as Promise<User | null>;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    }) as unknown as Promise<User | null>;
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data,
    }) as unknown as Promise<User>;
  }

  async delete(id: string): Promise<User> {
    return this.prisma.user.delete({
      where: { id },
    }) as unknown as Promise<User>;
  }
}