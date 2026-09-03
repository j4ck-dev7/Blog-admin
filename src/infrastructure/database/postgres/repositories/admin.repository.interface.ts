import { Admin, AdminWithRole } from '../../../../domain/entities/admin.entity';

export interface IAdminRepository {
  findByEmail(email: string): Promise<Admin | null>;
  findById(id: string): Promise<AdminWithRole | null>;
}
