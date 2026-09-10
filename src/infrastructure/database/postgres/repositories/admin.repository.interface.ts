import { Admin, AdminWithRole } from '../../../../domain/entities/admin.entity';

export interface IAdminRepository {
  findByEmail(email: string): Promise<Admin | null>;
  findById(id: string): Promise<AdminWithRole | null>;
  createAdmin(data: {
    name: string;
    email: string;
    password: string;
    role: string;
  }): Promise<Admin | null>;
}
