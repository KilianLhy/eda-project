import { randomUUID } from "node:crypto";

export class InMemorySavedViewRepository {
  constructor() {
    this.views = new Map();
  }

  save({ workspaceId, name, filters, createdBy }) {
    const id = randomUUID();
    const record = {
      id,
      workspaceId,
      name,
      filters,
      createdBy,
      createdAt: new Date().toISOString()
    };
    this.views.set(id, record);
    return record;
  }

  listByWorkspace(workspaceId) {
    return [...this.views.values()].filter((view) => view.workspaceId === workspaceId);
  }

  findById(viewId) {
    return this.views.get(viewId) ?? null;
  }
}
