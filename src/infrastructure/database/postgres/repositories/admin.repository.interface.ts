import { Admin } from '../../../../domain/entities/admin.entity';

export interface IAdminRepository {
  findById(id: string): Promise<Admin | null>;
}
