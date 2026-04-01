import { Task } from '../domain/task.entity';
import { TaskStatusValue } from '../domain/task-status.vo';

export class TaskDto {
  id: string;
  projectId: string;
  title: string;
  statusValue: TaskStatusValue;
  assigneeId: string | null;

  constructor(task: Task) {
    this.id = task.id;
    this.projectId = task.projectId;
    this.title = task.title;
    this.statusValue = task.statusValue;
    this.assigneeId = task.assigneeId;
  }

  static fromEntities(tasks: Task[]): TaskDto[] {
    return tasks.map((task) => new TaskDto(task));
  }
}
