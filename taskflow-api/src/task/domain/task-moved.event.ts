import { DomainEvent } from '../../shared/domain/domain-event';
import { TaskStatusValue } from './task-status.vo';

export const createTaskMovedEvent = (
  taskId: string,
  projectId: string,
  from: TaskStatusValue,
  to: TaskStatusValue,
  actorId: string,
): DomainEvent => ({
  name: 'task.moved',
  payload: {
    taskId,
    projectId,
    from,
    to,
    actorId,
  },
  occurredAt: new Date().toISOString(),
});
