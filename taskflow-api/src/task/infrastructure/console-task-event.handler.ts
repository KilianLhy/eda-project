import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { DomainEvent } from '../../shared/domain/domain-event';
import { EVENT_BUS } from '../../shared/domain/event-bus.port';
import type { EventBusPort } from '../../shared/domain/event-bus.port';

@Injectable()
export class ConsoleTaskEventHandler implements OnModuleInit {
  constructor(@Inject(EVENT_BUS) private readonly eventBus: EventBusPort) {}

  onModuleInit(): void {
    this.eventBus.subscribe('task.created', (event) => this.logEvent(event));
    this.eventBus.subscribe('task.moved', (event) => this.logEvent(event));
  }

  private logEvent(event: DomainEvent): void {
    const taskId =
      typeof event.payload.taskId === 'string'
        ? event.payload.taskId
        : 'unknown';
    // Required in phase 1: event name + taskId + timestamp in console output.
    console.log(`[${event.name}] taskId=${taskId} at ${event.occurredAt}`);
  }
}
