import { Project } from './project.entity';

export interface ProjectRepository {
  create(project: Project): Promise<Project>;
  findAll(): Promise<Project[]>;
  findById(projectId: string): Promise<Project | null>;
  update(project: Project): Promise<Project>;
}

export const PROJECT_REPOSITORY = Symbol('PROJECT_REPOSITORY');
