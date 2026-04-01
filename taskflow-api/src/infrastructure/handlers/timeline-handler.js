import { randomUUID } from "node:crypto";

const TEXT_BY_EVENT = {
  "task.created": (event) => `Task "${event.payload.title}" created`,
  "task.moved": (event) =>
    `Task "${event.payload.title}" moved ${event.payload.from} -> ${event.payload.to}`
};

export class TimelineHandler {
  constructor(timelineRepository) {
    this.timelineRepository = timelineRepository;
  }

  handle = (event) => {
    const makeText = TEXT_BY_EVENT[event.type] ?? (() => event.type);
    this.timelineRepository.append({
      id: randomUUID(),
      workspaceId: event.workspaceId,
      taskId: event.taskId,
      actorId: event.actorId,
      type: event.type,
      text: makeText(event),
      timestamp: event.occurredAt,
      payload: event.payload
    });
  };
}
