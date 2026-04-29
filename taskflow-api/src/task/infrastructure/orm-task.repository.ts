import { Injectable } from '@nestjs/common';
import { TaskStatusValue } from '../domain/task-status.vo';
import { PrismaService } from '../../shared/infrastructure/prisma.service';
import { Task } from '../domain/task.entity';
import { TaskRepository } from '../domain/task.repository';

@Injectable()
export class OrmTaskRepository implements TaskRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(task: {
    id: string;
    projectId: string;
    title: string;
    status: string;
    assigneeId: string | null;
  }): Task {
    return Task.rehydrate({
      id: task.id,
      projectId: task.projectId,
      title: task.title,
      status: task.status as TaskStatusValue,
      assigneeId: task.assigneeId,
    });
  }

  async create(task: Task): Promise<Task> {
    const created = await this.prisma.task.create({
      data: {
        id: task.id,
        projectId: task.projectId,
        title: task.title,
        status: task.statusValue,
        assigneeId: task.assigneeId,
      },
    });

    return this.toDomain(created);
  }

  async findById(taskId: string): Promise<Task | null> {
    const task = await this.prisma.task.findUnique({
      where: {
        id: taskId,
      },
    });

    if (!task) {
      return null;
    }

    return this.toDomain(task);
  }

  async findByProjectId(projectId: string): Promise<Task[]> {
    const tasks = await this.prisma.task.findMany({
      where: {
        projectId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return tasks.map((task) => this.toDomain(task));
  }

  async update(task: Task): Promise<Task> {
    const updated = await this.prisma.task.update({
      where: {
        id: task.id,
      },
      data: {
        title: task.title,
        status: task.statusValue,
        assigneeId: task.assigneeId,
      },
    });

    return this.toDomain(updated);
  }

  async delete(taskId: string): Promise<void> {
    await this.prisma.task.delete({
      where: {
        id: taskId,
      },
    });
  }
}
