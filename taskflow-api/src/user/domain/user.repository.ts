import { User } from './user.entity';

export interface UserRepository {
  findMany(ids: string[]): Promise<User[]>;
  findById(id: string): Promise<User | null>;
}

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
