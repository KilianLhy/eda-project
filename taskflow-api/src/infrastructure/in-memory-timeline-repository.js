export class InMemoryTimelineRepository {
  constructor() {
    this.items = [];
  }

  append(item) {
    this.items.unshift(item);
    return item;
  }

  listByWorkspace(workspaceId, limit = 100) {
    return this.items.filter((item) => item.workspaceId === workspaceId).slice(0, limit);
  }
}
