import { randomUUID } from "node:crypto";

export class AuditTrailHandler {
  constructor(auditRepository) {
    this.auditRepository = auditRepository;
  }

  handle = (event) => {
    this.auditRepository.append({
      id: randomUUID(),
      workspaceId: event.workspaceId,
      taskId: event.taskId,
      eventType: event.type,
      actorId: event.actorId,
      timestamp: event.occurredAt,
      payload: event.payload
    });
  };
}
