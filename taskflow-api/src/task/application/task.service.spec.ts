import { TaskService } from './task.service';
import { TaskRepository } from '../domain/task.repository';
import { EventBusPort } from '../../shared/domain/event-bus.port';
import { Task } from '../domain/task.entity';

class FakeTaskRepository implements TaskRepository {
  private readonly data = new Map<string, Task>();

  create(task: Task): Promise<Task> {
    this.data.set(task.id, task);
    return Promise.resolve(task);
  }

  findById(taskId: string): Promise<Task | null> {
    return Promise.resolve(this.data.get(taskId) ?? null);
  }

  findByProjectId(projectId: string): Promise<Task[]> {
    return Promise.resolve(
      Array.from(this.data.values()).filter(
        (task) => task.projectId === projectId,
      ),
    );
  }

  update(task: Task): Promise<Task> {
    this.data.set(task.id, task);
    return Promise.resolve(task);
  }
}

class FakeEventBus implements EventBusPort {
  public readonly published: Array<{ name: string }> = [];

  publish(event: { name: string }): void {
    this.published.push(event);
  }

  subscribe(): void {
    return;
  }
}

describe('TaskService', () => {
  it('publishes task.created on createTask', async () => {
    const repository = new FakeTaskRepository();
    const eventBus = new FakeEventBus();
    const service = new TaskService(repository, eventBus);

    await service.createTask({
      projectId: 'project-1',
      title: 'Implement feature',
      actorId: 'user-1',
    });

    expect(
      eventBus.published.some((event) => event.name === 'task.created'),
    ).toBe(true);
  });

  it('publishes task.moved on moveTask', async () => {
    const repository = new FakeTaskRepository();
    const eventBus = new FakeEventBus();
    const service = new TaskService(repository, eventBus);

    const created = await service.createTask({
      projectId: 'project-1',
      title: 'Implement feature',
      actorId: 'user-1',
    });

    await service.moveTask(created.id, 'in-progress', 'user-2');

    expect(
      eventBus.published.some((event) => event.name === 'task.moved'),
    ).toBe(true);
  });
});
