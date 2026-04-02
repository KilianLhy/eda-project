import { DomainEvent } from '../../shared/domain/domain-event';

export const createProjectCreatedEvent = (
  projectId: string,
  actorId: string,
): DomainEvent => ({
  name: 'project.created',
  payload: {
    projectId,
    actorId,
  },
  occurredAt: new Date().toISOString(),
});
