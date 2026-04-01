import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { EVENT_BUS } from '../../shared/domain/event-bus.port';
import type { EventBusPort } from '../../shared/domain/event-bus.port';
import { Task } from '../domain/task.entity';
import { createTaskAssignedEvent } from '../domain/task-assigned.event';
import { createTaskCreatedEvent } from '../domain/task-created.event';
import { createTaskMovedEvent } from '../domain/task-moved.event';
import { TASK_REPOSITORY } from '../domain/task.repository';
import type { TaskRepository } from '../domain/task.repository';
import { TaskStatusValue } from '../domain/task-status.vo';

@Injectable()
export class TaskService {
  constructor(
    @Inject(TASK_REPOSITORY) private readonly taskRepository: TaskRepository,
    @Inject(EVENT_BUS) private readonly eventBus: EventBusPort,
  ) {}

  async createTask(input: {
    projectId: string;
    title: string;
    assigneeId?: string;
    actorId: string;
  }): Promise<Task> {
    const task = Task.create({
      id: randomUUID(),
      projectId: input.projectId,
      title: input.title,
      assigneeId: input.assigneeId,
    });

    const created = await this.taskRepository.create(task);
    this.eventBus.publish(
      createTaskCreatedEvent(created.id, created.projectId, input.actorId),
    );
    return created;
  }

  async listTasks(projectId: string): Promise<Task[]> {
    return this.taskRepository.findByProjectId(projectId);
  }

  async moveTask(
    taskId: string,
    nextStatus: TaskStatusValue,
    actorId: string,
  ): Promise<Task> {
    const task = await this.taskRepository.findById(taskId);

    if (!task) {
      throw new NotFoundException(`Task ${taskId} not found`);
    }

    const previousStatus = task.statusValue;
    task.moveTo(nextStatus);
    const updated = await this.taskRepository.update(task);

    this.eventBus.publish(
      createTaskMovedEvent(
        updated.id,
        updated.projectId,
        previousStatus,
        nextStatus,
        actorId,
      ),
    );

    return updated;
  }

  async assignTask(
    taskId: string,
    assigneeId: string,
    actorId: string,
  ): Promise<Task> {
    const task = await this.taskRepository.findById(taskId);

    if (!task) {
      throw new NotFoundException(`Task ${taskId} not found`);
    }

    task.assignTo(assigneeId);
    const updated = await this.taskRepository.update(task);
    this.eventBus.publish(
      createTaskAssignedEvent(updated.id, assigneeId, actorId),
    );
    return updated;
  }
}
