// src/modules/user/services/user.service.ts
import { Injectable } from '@nestjs/common';
import type { IAdminRepository } from './repositories/admin.repository.interface.js';
import { Prisma } from '../../../generated/prisma/client.js';

@Injectable()
export class adminService {
  constructor(
    private readonly adminRepository: IAdminRepository,
  ) {}

  create(data: Prisma.UserCreateInput) {
    return this.adminRepository.create(data);
  }

  findAll() {
    return this.adminRepository.findAll();
  }

  findById(id: string) {
    return this.adminRepository.findById(id);
  }

  update(id: string, data: Prisma.UserUpdateInput) {
    return this.adminRepository.update(id, data);
  }

  delete(id: string) {
    return this.adminRepository.delete(id);
  }
}