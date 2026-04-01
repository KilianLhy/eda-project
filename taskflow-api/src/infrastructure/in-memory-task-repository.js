import { Task } from "../domain/task.js";
import { NotFoundError } from "../domain/errors.js";

export class InMemoryTaskRepository {
  constructor() {
    this.tasks = new Map();
  }

  save(task) {
    this.tasks.set(task.id, task);
    return task;
  }

  findById(taskId) {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new NotFoundError(`Task not found: ${taskId}`);
    }
    return task;
  }

  listByWorkspace(workspaceId) {
    return [...this.tasks.values()].filter((task) => task.workspaceId === workspaceId);
  }

  bootstrapSample(workspaceId = "demo-workspace") {
    if (this.listByWorkspace(workspaceId).length > 0) {
      return;
    }

    this.save(new Task({ workspaceId, title: "Set up architecture ADRs", assigneeId: "u1" }));
    this.save(new Task({ workspaceId, title: "Create task module", assigneeId: "u2" }));
    this.save(
      new Task({
        workspaceId,
        title: "Prepare demo timeline",
        assigneeId: "u1",
        status: "In Progress"
      })
    );
  }
}
