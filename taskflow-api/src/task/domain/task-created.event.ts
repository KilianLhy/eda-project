import { DomainEvent } from '../../shared/domain/domain-event';

export const createTaskCreatedEvent = (
  taskId: string,
  projectId: string,
  actorId: string,
): DomainEvent => ({
  name: 'task.created',
  payload: {
    taskId,
    projectId,
    actorId,
  },
  occurredAt: new Date().toISOString(),
});
