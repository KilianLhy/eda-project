export interface DomainEvent {
  name: string;
  payload: Record<string, unknown>;
  occurredAt: string;
}
