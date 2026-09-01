import { Admin } from '../../../../domain/entities/admin.entity';

export interface IAdminRepository {
  findByEmail(email: string): Promise<Admin | null>;
}
