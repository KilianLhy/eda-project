import { DomainError } from "./errors.js";

const ORDER = ["Todo", "In Progress", "Done"];

export class TaskStatus {
  constructor(value) {
    if (!ORDER.includes(value)) {
      throw new DomainError(
        `Invalid task status: ${value}`,
        "INVALID_TASK_STATUS"
      );
    }
    this.value = value;
  }

  transitionTo(nextValue) {
    const next = new TaskStatus(nextValue);
    const currentIndex = ORDER.indexOf(this.value);
    const nextIndex = ORDER.indexOf(next.value);

    if (nextIndex !== currentIndex + 1) {
      throw new DomainError(
        `Invalid transition from "${this.value}" to "${next.value}"`,
        "INVALID_TASK_TRANSITION"
      );
    }

    return next;
  }
}
