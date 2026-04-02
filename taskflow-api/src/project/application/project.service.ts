import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { EVENT_BUS } from '../../shared/domain/event-bus.port';
import type { EventBusPort } from '../../shared/domain/event-bus.port';
import { createMemberAddedEvent } from '../domain/member-added.event';
import { createProjectCreatedEvent } from '../domain/project-created.event';
import { Project } from '../domain/project.entity';
import { PROJECT_REPOSITORY } from '../domain/project.repository';
import type { ProjectRepository } from '../domain/project.repository';

@Injectable()
export class ProjectService {
  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: ProjectRepository,
    @Inject(EVENT_BUS) private readonly eventBus: EventBusPort,
  ) {}

  async createProject(name: string, actorId: string): Promise<Project> {
    const project = new Project(randomUUID(), name);
    const created = await this.projectRepository.create(project);
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
}
