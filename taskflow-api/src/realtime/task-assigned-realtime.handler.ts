import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { DomainEvent } from '../shared/domain/domain-event';
import { EVENT_BUS } from '../shared/domain/event-bus.port';
import type { EventBusPort } from '../shared/domain/event-bus.port';
import { REALTIME_BROADCASTER } from './realtime-broadcaster.port';
import type { RealtimeBroadcasterPort } from './realtime-broadcaster.port';
import { TASK_REPOSITORY } from '../task/domain/task.repository';
import type { TaskRepository } from '../task/domain/task.repository';

@Injectable()
export class TaskAssignedRealtimeHandler implements OnModuleInit {
  constructor(
    @Inject(EVENT_BUS) private readonly eventBus: EventBusPort,
    @Inject(REALTIME_BROADCASTER)
    private readonly realtimeBroadcaster: RealtimeBroadcasterPort,
    @Inject(TASK_REPOSITORY) private readonly taskRepository: TaskRepository,
  ) {}

  onModuleInit(): void {
    if (process.env.NODE_ENV === 'cli') {
      return;
    }

    this.eventBus.subscribe('task.assigned', (event) =>
      this.handleTaskAssigned(event),
    );
  }

  private async handleTaskAssigned(event: DomainEvent): Promise<void> {
    const taskId =
      typeof event.payload.taskId === 'string' ? event.payload.taskId : null;

    if (!taskId) {
      return;
    }

    const task = await this.taskRepository.findById(taskId);
    if (!task) {
      return;
    }

    this.realtimeBroadcaster.broadcastToProject(
      task.projectId,
      'task.assigned',
      {
        taskId: event.payload.taskId,
        taskTitle: task.title,
        assigneeId: event.payload.assigneeId,
        projectId: task.projectId,
        occurredAt: event.occurredAt,
      },
    );
  }
}
