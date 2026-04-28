import { DomainEvent } from '../../shared/domain/domain-event';

export const createTaskDeletedEvent = (
  taskId: string,
  projectId: string,
  actorId?: string,
): DomainEvent => ({
  name: 'task.deleted',
  payload: {
    taskId,
    projectId,
    actorId,
  },
  occurredAt: new Date().toISOString(),
});
