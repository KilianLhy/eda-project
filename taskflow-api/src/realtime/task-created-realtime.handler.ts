import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { DomainEvent } from '../shared/domain/domain-event';
import { EVENT_BUS } from '../shared/domain/event-bus.port';
import type { EventBusPort } from '../shared/domain/event-bus.port';
import { REALTIME_BROADCASTER } from './realtime-broadcaster.port';
import type { RealtimeBroadcasterPort } from './realtime-broadcaster.port';

@Injectable()
export class TaskCreatedRealtimeHandler implements OnModuleInit {
  constructor(
    @Inject(EVENT_BUS) private readonly eventBus: EventBusPort,
    @Inject(REALTIME_BROADCASTER)
    private readonly realtimeBroadcaster: RealtimeBroadcasterPort,
  ) {}

  onModuleInit(): void {
    if (process.env.NODE_ENV === 'cli') {
      return;
    }

    this.eventBus.subscribe('task.created', (event) =>
      this.handleTaskCreated(event),
    );
  }

  private handleTaskCreated(event: DomainEvent): void {
    const projectId =
      typeof event.payload.projectId === 'string'
        ? event.payload.projectId
        : null;
    const taskId =
      typeof event.payload.taskId === 'string' ? event.payload.taskId : null;

    if (!projectId || !taskId) {
      return;
    }

    this.realtimeBroadcaster.broadcastToProject(projectId, 'task.created', {
      taskId: event.payload.taskId,
      projectId,
      actorId: event.payload.actorId,
      occurredAt: event.occurredAt,
    });
  }
}
