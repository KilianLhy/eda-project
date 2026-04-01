export class InMemoryAuditRepository {
  constructor() {
    this.entries = [];
  }

  append(entry) {
    this.entries.unshift(entry);
    return entry;
  }

  listByWorkspace(workspaceId, limit = 100) {
    return this.entries.filter((entry) => entry.workspaceId === workspaceId).slice(0, limit);
  }
}
