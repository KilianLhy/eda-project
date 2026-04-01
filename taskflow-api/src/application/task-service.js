import { randomUUID } from "node:crypto";
import { DomainError, NotFoundError } from "../domain/errors.js";
import { Task } from "../domain/task.js";

function buildEvent({ type, workspaceId, actorId, taskId, payload }) {
  return {
    id: randomUUID(),
    type,
    workspaceId,
    actorId: actorId ?? "system",
    taskId,
    occurredAt: new Date().toISOString(),
    payload
  };
}

function normalizeFilters(input = {}) {
  const normalized = {};
  if (input.status) normalized.status = String(input.status);
  if (input.assigneeId) normalized.assigneeId = String(input.assigneeId);
  if (input.projectId) normalized.projectId = String(input.projectId);
  if (input.search) normalized.search = String(input.search).trim();
  return normalized;
}

function applyFilters(tasks, filters) {
  return tasks.filter((task) => {
    if (filters.status && task.status !== filters.status) return false;
    if (filters.assigneeId && task.assigneeId !== filters.assigneeId) return false;
    if (filters.projectId && task.projectId !== filters.projectId) return false;
    if (
      filters.search &&
      !task.title.toLowerCase().includes(filters.search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });
}

export class TaskService {
  constructor({
    taskRepository,
    savedViewRepository,
    auditRepository,
    timelineRepository,
    eventBus
  }) {
    this.taskRepository = taskRepository;
    this.savedViewRepository = savedViewRepository;
    this.auditRepository = auditRepository;
    this.timelineRepository = timelineRepository;
    this.eventBus = eventBus;
  }

  createTask({ workspaceId, title, assigneeId = null, projectId = null, actorId }) {
    const task = new Task({ workspaceId, title, assigneeId, projectId });
    this.taskRepository.save(task);

    this.eventBus.publish(
      buildEvent({
        type: "task.created",
        workspaceId,
        actorId,
        taskId: task.id,
        payload: {
          title: task.title,
          status: task.status,
          assigneeId: task.assigneeId,
          projectId: task.projectId
        }
      })
    );

    return task;
  }

  moveTask({ workspaceId, taskId, status, actorId }) {
    const task = this.taskRepository.findById(taskId);
    if (task.workspaceId !== workspaceId) {
      throw new NotFoundError(`Task ${taskId} does not belong to workspace ${workspaceId}`);
    }

    const { from, to } = task.moveTo(status);
    this.taskRepository.save(task);

    this.eventBus.publish(
      buildEvent({
        type: "task.moved",
        workspaceId,
        actorId,
        taskId,
        payload: {
          title: task.title,
          from,
          to
        }
      })
    );

    return task;
  }

  listTasks({ workspaceId, queryFilters = {}, viewId = null }) {
    const allTasks = this.taskRepository.listByWorkspace(workspaceId);
    const effectiveFilters = this.resolveEffectiveFilters({
      workspaceId,
      viewId,
      queryFilters
    });
    return applyFilters(allTasks, effectiveFilters);
  }

  createSavedView({ workspaceId, name, filters, createdBy = "system" }) {
    if (!name || !name.trim()) {
      throw new DomainError("View name is required", "VIEW_NAME_REQUIRED");
    }
    const normalizedFilters = normalizeFilters(filters);
    return this.savedViewRepository.save({
      workspaceId,
      name: name.trim(),
      filters: normalizedFilters,
      createdBy
    });
  }

  listSavedViews(workspaceId) {
    return this.savedViewRepository.listByWorkspace(workspaceId);
  }

  listTimeline({ workspaceId, limit }) {
    return this.timelineRepository.listByWorkspace(workspaceId, limit);
  }

  listAuditTrail({ workspaceId, limit }) {
    return this.auditRepository.listByWorkspace(workspaceId, limit);
  }

  resolveEffectiveFilters({ workspaceId, viewId, queryFilters }) {
    const query = normalizeFilters(queryFilters);
    if (!viewId) {
      return query;
    }

    const view = this.savedViewRepository.findById(viewId);
    if (!view || view.workspaceId !== workspaceId) {
      throw new NotFoundError(`Saved view not found: ${viewId}`);
    }

    return { ...view.filters, ...query };
  }
}
