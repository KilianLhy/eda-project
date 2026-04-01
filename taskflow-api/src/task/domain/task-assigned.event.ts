import { DomainEvent } from '../../shared/domain/domain-event';

export const createTaskAssignedEvent = (
  taskId: string,
  assigneeId: string,
  actorId: string,
): DomainEvent => ({
  name: 'task.assigned',
  payload: {
    taskId,
    assigneeId,
    actorId,
  },
  occurredAt: new Date().toISOString(),
});
