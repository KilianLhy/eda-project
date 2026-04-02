import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/infrastructure/prisma.service';
import { Project } from '../domain/project.entity';
import { ProjectRepository } from '../domain/project.repository';

@Injectable()
export class OrmProjectRepository implements ProjectRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(project: {
    id: string;
    name: string;
    members: Array<{ memberId: string }>;
  }): Project {
    return new Project(
      project.id,
      project.name,
      project.members.map((member) => member.memberId),
    );
  }

  async create(project: Project): Promise<Project> {
    const created = await this.prisma.project.create({
      data: {
        id: project.id,
        name: project.name,
        members: {
          create: project.memberIds.map((memberId) => ({ memberId })),
        },
      },
      include: {
        members: true,
      },
    });

    return this.toDomain(created);
  }

  async findAll(): Promise<Project[]> {
    const projects = await this.prisma.project.findMany({
      include: {
        members: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return projects.map((project) => this.toDomain(project));
  }

  async findById(projectId: string): Promise<Project | null> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: true,
      },
    });

    if (!project) {
      return null;
    }

    return this.toDomain(project);
  }

  async update(project: Project): Promise<Project> {
    const updated = await this.prisma.project.update({
      where: { id: project.id },
      data: {
        name: project.name,
        members: {
          deleteMany: {},
          create: project.memberIds.map((memberId) => ({ memberId })),
        },
      },
      include: {
        members: true,
      },
    });

    return this.toDomain(updated);
  }
}
