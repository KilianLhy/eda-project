import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { EVENT_BUS } from '../shared/domain/event-bus.port';
import type { EventBusPort } from '../shared/domain/event-bus.port';
import { DomainEvent } from '../shared/domain/domain-event';
import { PrismaService } from '../shared/infrastructure/prisma.service';
import type { Prisma } from '@prisma/client';

@Injectable()
export class AuditLogHandler implements OnModuleInit {
  constructor(
    @Inject(EVENT_BUS) private readonly eventBus: EventBusPort,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit(): void {
    if (process.env.NODE_ENV === 'cli') {
      return;
    }

    const eventNames = [
      'project.created',
      'member.added',
      'task.created',
      'task.moved',
      'task.assigned',
    ];

    eventNames.forEach((eventName) => {
      this.eventBus.subscribe(eventName, (event) => {
        void this.persist(event);
      });
    });
  }

  private async persist(event: DomainEvent): Promise<void> {
    const entityType = event.name.startsWith('task.') ? 'Task' : 'Project';
    const entityId =
      (typeof event.payload.taskId === 'string' && event.payload.taskId) ||
      (typeof event.payload.projectId === 'string' &&
        event.payload.projectId) ||
      'unknown';

    const actorId =
      typeof event.payload.actorId === 'string' ? event.payload.actorId : null;

    await this.prisma.auditLog.create({
      data: {
        entityType,
        entityId,
        action: event.name,
        actorId,
        occurredAt: new Date(event.occurredAt),
        payload: event.payload as Prisma.InputJsonValue,
      },
    });
  }
}
