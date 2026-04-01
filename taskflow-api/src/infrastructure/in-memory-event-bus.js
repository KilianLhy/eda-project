export class InMemoryEventBus {
  constructor() {
    this.handlersByType = new Map();
  }

  subscribe(eventType, handler) {
    const handlers = this.handlersByType.get(eventType) ?? [];
    handlers.push(handler);
    this.handlersByType.set(eventType, handlers);
  }

  publish(event) {
    const handlers = this.handlersByType.get(event.type) ?? [];
    handlers.forEach((handler) => handler(event));
  }
}
