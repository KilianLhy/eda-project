import { Task } from './task.entity';

export interface TaskRepository {
  create(task: Task): Promise<Task>;
  findById(taskId: string): Promise<Task | null>;
  findByProjectId(projectId: string): Promise<Task[]>;
  update(task: Task): Promise<Task>;
  delete(taskId: string): Promise<void>;
}

export const TASK_REPOSITORY = Symbol('TASK_REPOSITORY');
