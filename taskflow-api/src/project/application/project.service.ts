import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { EVENT_BUS } from '../../shared/domain/event-bus.port';
import type { EventBusPort } from '../../shared/domain/event-bus.port';
import { createMemberAddedEvent } from '../domain/member-added.event';
import { createProjectCreatedEvent } from '../domain/project-created.event';
import { Project } from '../domain/project.entity';
import { PROJECT_REPOSITORY } from '../domain/project.repository';
import type { ProjectRepository } from '../domain/project.repository';
import { USER_REPOSITORY } from '../../user/domain/user.repository';
import type { UserRepository } from '../../user/domain/user.repository';

export interface ProjectMemberDto {
  id: string;
  email: string;
}

@Injectable()
export class ProjectService {
  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: ProjectRepository,
    @Inject(EVENT_BUS) private readonly eventBus: EventBusPort,
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
  ) {}

  async createProject(name: string, actorId: string): Promise<Project> {
    const project = new Project(randomUUID(), name);
    const created = await this.projectRepository.create(project);

    // Auto-add creator as member
    project.addMember(actorId);
    await this.projectRepository.update(project);

    this.eventBus.publish(createProjectCreatedEvent(created.id, actorId));
    return created;
  }

  async listProjects(): Promise<Project[]> {
    return this.projectRepository.findAll();
  }

  async addMember(
    projectId: string,
    memberId: string,
    actorId: string,
  ): Promise<Project> {
    const project = await this.projectRepository.findById(projectId);

    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    project.addMember(memberId);
    const updated = await this.projectRepository.update(project);
    this.eventBus.publish(createMemberAddedEvent(projectId, memberId, actorId));
    return updated;
  }

  async getMembers(projectId: string): Promise<ProjectMemberDto[]> {
    const project = await this.projectRepository.findById(projectId);

    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    const users = await this.userRepository.findMany(project.memberIds);

    return users.map((user) => ({
      id: user.id,
      email: user.email,
    }));
  }
}
