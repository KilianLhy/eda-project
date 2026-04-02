import { Body, Controller, Get, Headers, Param, Post } from '@nestjs/common';
import { ProjectService } from '../application/project.service';

interface CreateProjectDto {
  name: string;
}

interface AddMemberDto {
  memberId: string;
}

@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  async createProject(
    @Body() body: CreateProjectDto,
    @Headers('x-user-id') userId?: string,
  ) {
    return this.projectService.createProject(body.name, userId ?? 'demo-user');
  }

  @Get()
  async listProjects() {
    return this.projectService.listProjects();
  }

  @Post(':projectId/members')
  async addMember(
    @Param('projectId') projectId: string,
    @Body() body: AddMemberDto,
    @Headers('x-user-id') userId?: string,
  ) {
    return this.projectService.addMember(
      projectId,
      body.memberId,
      userId ?? 'demo-user',
    );
  }
}
