import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ProjectService } from '../../project/application/project.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CurrentUserDecorator } from '../../shared/presentation/current-user.decorator';
import type { CurrentUser } from '../../shared/presentation/current-user.decorator';

interface CreateProjectDto {
  name: string;
}

interface AddMemberDto {
  memberId: string;
}

@UseGuards(JwtAuthGuard)
@Controller('api/v2/projects')
export class ProjectControllerV2 {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  async createProject(
    @Body() body: CreateProjectDto,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    const project = await this.projectService.createProject(body.name, user.id);
    return {
      data: project,
      version: '2.0',
    };
  }

  @Get()
  async listProjects() {
    const projects = await this.projectService.listProjects();
    return {
      data: projects,
      version: '2.0',
    };
  }

  @Get(':projectId/members')
  async getMembers(@Param('projectId') projectId: string) {
    const members = await this.projectService.getMembers(projectId);
    return {
      data: members,
      version: '2.0',
    };
  }

  @Post(':projectId/members')
  async addMember(
    @Param('projectId') projectId: string,
    @Body() body: AddMemberDto,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    const project = await this.projectService.addMember(
      projectId,
      body.memberId,
      user.id,
    );
    return {
      data: project,
      version: '2.0',
    };
  }
}
