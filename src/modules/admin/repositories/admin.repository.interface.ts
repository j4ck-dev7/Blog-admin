import type { User, Prisma } from "../../../../generated/prisma/client";

export interface IAdminRepository {
    create(data: Prisma.UserCreateInput) : Promise<User>;
    findAll(): Promise<User[]>;
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    update(id: string, data: Prisma.UserUpdateInput): Promise<User>;
    delete(id: string): Promise<User>;
}