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
@Controller('api/v1/projects')
export class ProjectControllerV1 {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  async createProject(
    @Body() body: CreateProjectDto,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    return this.projectService.createProject(body.name, user.id);
  }

  @Get()
  async listProjects() {
    return this.projectService.listProjects();
  }

  @Get(':projectId/members')
  async getMembers(@Param('projectId') projectId: string) {
    return this.projectService.getMembers(projectId);
  }

  @Post(':projectId/members')
  async addMember(
    @Param('projectId') projectId: string,
    @Body() body: AddMemberDto,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    return this.projectService.addMember(projectId, body.memberId, user.id);
  }
}
