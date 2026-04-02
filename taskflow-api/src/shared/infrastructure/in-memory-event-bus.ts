import { Injectable } from '@nestjs/common';
import { DomainEvent } from '../domain/domain-event';
import { EventBusPort } from '../domain/event-bus.port';

@Injectable()
export class InMemoryEventBus implements EventBusPort {
  private readonly handlers = new Map<
    string,
    Array<(event: DomainEvent) => void>
  >();

  publish(event: DomainEvent): void {
    const callbacks = this.handlers.get(event.name) ?? [];
    callbacks.forEach((callback) => callback(event));
  }

  subscribe(eventName: string, handler: (event: DomainEvent) => void): void {
    const callbacks = this.handlers.get(eventName) ?? [];
    callbacks.push(handler);
    this.handlers.set(eventName, callbacks);
  }
}
