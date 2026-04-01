import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { TaskService } from "./application/task-service.js";
import { DomainError, NotFoundError } from "./domain/errors.js";
import { InMemoryAuditRepository } from "./infrastructure/in-memory-audit-repository.js";
import { InMemoryEventBus } from "./infrastructure/in-memory-event-bus.js";
import { InMemorySavedViewRepository } from "./infrastructure/in-memory-saved-view-repository.js";
import { InMemoryTaskRepository } from "./infrastructure/in-memory-task-repository.js";
import { InMemoryTimelineRepository } from "./infrastructure/in-memory-timeline-repository.js";
import { AuditTrailHandler } from "./infrastructure/handlers/audit-trail-handler.js";
import { TimelineHandler } from "./infrastructure/handlers/timeline-handler.js";

const app = express();
app.use(express.json());
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webDir = path.resolve(__dirname, "../../taskflow-web");
app.use(express.static(webDir));

function resolvePort() {
  const flagWithEquals = process.argv.find((arg) => arg.startsWith("--port="));
  if (flagWithEquals) {
    const parsed = Number(flagWithEquals.split("=")[1]);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }

  const portFlagIndex = process.argv.indexOf("--port");
  if (portFlagIndex >= 0) {
    const parsed = Number(process.argv[portFlagIndex + 1]);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }

  const envPort = Number(process.env.PORT);
  if (Number.isFinite(envPort) && envPort > 0) {
    return envPort;
  }

  return 3001;
}

const eventBus = new InMemoryEventBus();
const taskRepository = new InMemoryTaskRepository();
const savedViewRepository = new InMemorySavedViewRepository();
const auditRepository = new InMemoryAuditRepository();
const timelineRepository = new InMemoryTimelineRepository();

const auditTrailHandler = new AuditTrailHandler(auditRepository);
const timelineHandler = new TimelineHandler(timelineRepository);
eventBus.subscribe("task.created", auditTrailHandler.handle);
eventBus.subscribe("task.moved", auditTrailHandler.handle);
eventBus.subscribe("task.created", timelineHandler.handle);
eventBus.subscribe("task.moved", timelineHandler.handle);

const taskService = new TaskService({
  taskRepository,
  savedViewRepository,
  auditRepository,
  timelineRepository,
  eventBus
});

taskRepository.bootstrapSample("demo-workspace");

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/", (_req, res) => {
  res.sendFile(path.join(webDir, "index.html"));
});

app.post("/workspaces/:workspaceId/tasks", (req, res, next) => {
  try {
    const task = taskService.createTask({
      workspaceId: req.params.workspaceId,
      title: req.body?.title,
      assigneeId: req.body?.assigneeId ?? null,
      projectId: req.body?.projectId ?? null,
      actorId: req.body?.actorId ?? "api-user"
    });
    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
});

app.patch("/workspaces/:workspaceId/tasks/:taskId/status", (req, res, next) => {
  try {
    const task = taskService.moveTask({
      workspaceId: req.params.workspaceId,
      taskId: req.params.taskId,
      status: req.body?.status,
      actorId: req.body?.actorId ?? "api-user"
    });
    res.json(task);
  } catch (error) {
    next(error);
  }
});

app.get("/workspaces/:workspaceId/tasks", (req, res, next) => {
  try {
    const tasks = taskService.listTasks({
      workspaceId: req.params.workspaceId,
      viewId: req.query.viewId ?? null,
      queryFilters: {
        status: req.query.status,
        assigneeId: req.query.assigneeId,
        projectId: req.query.projectId,
        search: req.query.search
      }
    });
    res.json(tasks);
  } catch (error) {
    next(error);
  }
});

app.post("/workspaces/:workspaceId/views", (req, res, next) => {
  try {
    const view = taskService.createSavedView({
      workspaceId: req.params.workspaceId,
      name: req.body?.name,
      createdBy: req.body?.createdBy ?? "api-user",
      filters: req.body?.filters ?? {}
    });
    res.status(201).json(view);
  } catch (error) {
    next(error);
  }
});

app.get("/workspaces/:workspaceId/views", (req, res, next) => {
  try {
    const views = taskService.listSavedViews(req.params.workspaceId);
    res.json(views);
  } catch (error) {
    next(error);
  }
});

app.get("/workspaces/:workspaceId/timeline", (req, res, next) => {
  try {
    const limit = Number(req.query.limit ?? 100);
    const timeline = taskService.listTimeline({
      workspaceId: req.params.workspaceId,
      limit
    });
    res.json(timeline);
  } catch (error) {
    next(error);
  }
});

app.get("/workspaces/:workspaceId/audit", (req, res, next) => {
  try {
    const limit = Number(req.query.limit ?? 100);
    const entries = taskService.listAuditTrail({
      workspaceId: req.params.workspaceId,
      limit
    });
    res.json(entries);
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  if (error instanceof DomainError) {
    res.status(400).json({ code: error.code, message: error.message });
    return;
  }

  if (error instanceof NotFoundError) {
    res.status(404).json({ code: error.code, message: error.message });
    return;
  }

  res.status(500).json({
    code: "INTERNAL_ERROR",
    message: error?.message ?? "Unexpected error"
  });
});

const port = resolvePort();
app.listen(port, () => {
  // This log confirms API boot in local runs and CI smoke jobs.
  console.log(`taskflow-api listening on http://localhost:${port}`);
});
