export type TaskStatusValue = 'todo' | 'in-progress' | 'done';

const ALLOWED_TRANSITIONS: Record<TaskStatusValue, TaskStatusValue[]> = {
  todo: ['in-progress'],
  'in-progress': ['done', 'todo'],
  done: ['in-progress'],
};

export class TaskStatus {
  constructor(private readonly value: TaskStatusValue) {}

  get current(): TaskStatusValue {
    return this.value;
  }

  canTransitionTo(next: TaskStatusValue): boolean {
    return ALLOWED_TRANSITIONS[this.value].includes(next);
  }

  transitionTo(next: TaskStatusValue): TaskStatus {
    if (!this.canTransitionTo(next)) {
      throw new Error(`Invalid transition: ${this.value} -> ${next}`);
    }

    return new TaskStatus(next);
  }
}
