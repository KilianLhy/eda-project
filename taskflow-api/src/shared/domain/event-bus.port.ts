import { DomainEvent } from './domain-event';

export interface EventBusPort {
  publish(event: DomainEvent): void;
  subscribe(eventName: string, handler: (event: DomainEvent) => void): void;
}

export const EVENT_BUS = Symbol('EVENT_BUS');
