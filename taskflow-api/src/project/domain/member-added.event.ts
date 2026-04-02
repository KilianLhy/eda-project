import { DomainEvent } from '../../shared/domain/domain-event';

export const createMemberAddedEvent = (
  projectId: string,
  memberId: string,
  actorId: string,
): DomainEvent => ({
  name: 'member.added',
  payload: {
    projectId,
    memberId,
    actorId,
  },
  occurredAt: new Date().toISOString(),
});
