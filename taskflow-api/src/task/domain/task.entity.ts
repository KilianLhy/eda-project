import { TaskStatus, TaskStatusValue } from './task-status.vo';

export class Task {
  constructor(
    public readonly id: string,
    public readonly projectId: string,
    public title: string,
    private status: TaskStatus,
    public assigneeId: string | null,
  ) {}

  static create(params: {
    id: string;
    projectId: string;
    title: string;
    assigneeId?: string | null;
  }): Task {
    return new Task(
      params.id,
      params.projectId,
      params.title,
      new TaskStatus('todo'),
      params.assigneeId ?? null,
    );
  }

  static rehydrate(params: {
    id: string;
    projectId: string;
    title: string;
    status: TaskStatusValue;
    assigneeId?: string | null;
  }): Task {
    return new Task(
      params.id,
      params.projectId,
      params.title,
      new TaskStatus(params.status),
      params.assigneeId ?? null,
    );
  }

  get statusValue(): TaskStatusValue {
    return this.status.current;
  }

  moveTo(nextStatus: TaskStatusValue): void {
    this.status = this.status.transitionTo(nextStatus);
  }

  assignTo(assigneeId: string): void {
    this.assigneeId = assigneeId;
  }

  toJSON() {
    return {
      id: this.id,
      projectId: this.projectId,
      title: this.title,
      statusValue: this.statusValue,
      assigneeId: this.assigneeId,
    };
  }
}
