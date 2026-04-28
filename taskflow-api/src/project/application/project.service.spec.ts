import { ProjectService } from './project.service';
import { ProjectRepository } from '../domain/project.repository';
import { UserRepository } from '../../user/domain/user.repository';
import { EventBusPort } from '../../shared/domain/event-bus.port';
import { Project } from '../domain/project.entity';
import { User } from '../../user/domain/user.entity';

class FakeProjectRepository implements ProjectRepository {
  private readonly data = new Map<string, Project>();

  create(project: Project): Promise<Project> {
    this.data.set(project.id, project);
    return Promise.resolve(project);
  }

  findAll(): Promise<Project[]> {
    return Promise.resolve(Array.from(this.data.values()));
  }

  findById(projectId: string): Promise<Project | null> {
    return Promise.resolve(this.data.get(projectId) ?? null);
  }

  update(project: Project): Promise<Project> {
    this.data.set(project.id, project);
    return Promise.resolve(project);
  }
}

class FakeUserRepository implements UserRepository {
  private readonly data = new Map<string, User>();

  async findMany(ids: string[]): Promise<User[]> {
    return ids
      .map((id) => this.data.get(id))
      .filter((user) => user !== undefined) as User[];
  }

  async findById(id: string): Promise<User | null> {
    return this.data.get(id) ?? null;
  }

  addUser(user: User): void {
    this.data.set(user.id, user);
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

describe('ProjectService', () => {
  it('publishes project.created on createProject', async () => {
    const projectRepository = new FakeProjectRepository();
    const userRepository = new FakeUserRepository();
    const eventBus = new FakeEventBus();
    const service = new ProjectService(
      projectRepository,
      eventBus,
      userRepository,
    );

    await service.createProject('Test Project', 'user-1');

    expect(
      eventBus.published.some((event) => event.name === 'project.created'),
    ).toBe(true);
  });

  it('publishes member.added on addMember', async () => {
    const projectRepository = new FakeProjectRepository();
    const userRepository = new FakeUserRepository();
    const eventBus = new FakeEventBus();
    const service = new ProjectService(
      projectRepository,
      eventBus,
      userRepository,
    );

    const project = await service.createProject('Test Project', 'user-1');

    eventBus.published.length = 0;

    await service.addMember(project.id, 'user-2', 'user-1');

    expect(
      eventBus.published.some((event) => event.name === 'member.added'),
    ).toBe(true);
  });

  it('returns members for a project', async () => {
    const projectRepository = new FakeProjectRepository();
    const userRepository = new FakeUserRepository();
    const eventBus = new FakeEventBus();

    userRepository.addUser(new User('user-1', 'user1@example.com'));
    userRepository.addUser(new User('user-2', 'user2@example.com'));

    const service = new ProjectService(
      projectRepository,
      eventBus,
      userRepository,
    );

    const project = await service.createProject('Test Project', 'user-1');
    await service.addMember(project.id, 'user-2', 'user-1');

    const members = await service.getMembers(project.id);

    expect(members).toHaveLength(2);
    expect(members.map((m) => m.id)).toContain('user-1');
    expect(members.map((m) => m.id)).toContain('user-2');
  });
});
