import { randomUUID } from "node:crypto";
import { DomainError } from "./errors.js";
import { TaskStatus } from "./task-status.js";

export class Task {
  constructor({
    id,
    title,
    workspaceId,
    projectId = null,
    assigneeId = null,
    status = "Todo",
    createdAt = new Date().toISOString(),
    updatedAt = new Date().toISOString()
  }) {
    if (!workspaceId) {
      throw new DomainError("workspaceId is required", "TASK_WORKSPACE_REQUIRED");
    }
    if (!title || !title.trim()) {
      throw new DomainError("Task title is required", "TASK_TITLE_REQUIRED");
    }

    this.id = id ?? randomUUID();
    this.title = title.trim();
    this.workspaceId = workspaceId;
    this.projectId = projectId;
    this.assigneeId = assigneeId;
    this.status = new TaskStatus(status).value;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  moveTo(nextStatus, updatedAt = new Date().toISOString()) {
    const from = this.status;
    this.status = new TaskStatus(this.status).transitionTo(nextStatus).value;
    this.updatedAt = updatedAt;
    return { from, to: this.status };
  }
}
