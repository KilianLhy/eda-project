import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TaskService } from '../../task/application/task.service';
import { TaskStatusValue } from '../../task/domain/task-status.vo';
import { TaskDto } from '../../task/presentation/task.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CurrentUserDecorator } from '../../shared/presentation/current-user.decorator';
import type { CurrentUser } from '../../shared/presentation/current-user.decorator';

interface CreateTaskDto {
  projectId: string;
  title: string;
  assigneeId?: string;
}

interface MoveTaskDto {
  status: TaskStatusValue;
}

interface AssignTaskDto {
  assigneeId: string;
}

@UseGuards(JwtAuthGuard)
@Controller('api/v2/tasks')
export class TaskControllerV2 {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  async createTask(
    @Body() body: CreateTaskDto,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    const task = await this.taskService.createTask({
      projectId: body.projectId,
      title: body.title,
      assigneeId: body.assigneeId,
      actorId: user.id,
    });
    return {
      data: new TaskDto(task),
      version: '2.0',
    };
  }

  @Get()
  async listTasks(@Query('projectId') projectId: string) {
    const tasks = await this.taskService.listTasks(projectId);
    return {
      data: TaskDto.fromEntities(tasks),
      version: '2.0',
    };
  }

  @Patch(':taskId/move')
  async moveTask(
    @Param('taskId') taskId: string,
    @Body() body: MoveTaskDto,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    const task = await this.taskService.moveTask(taskId, body.status, user.id);
    return {
      data: new TaskDto(task),
      version: '2.0',
    };
  }

  @Patch(':taskId/assign')
  async assignTask(
    @Param('taskId') taskId: string,
    @Body() body: AssignTaskDto,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    const task = await this.taskService.assignTask(
      taskId,
      body.assigneeId,
      user.id,
    );
    return {
      data: new TaskDto(task),
      version: '2.0',
    };
  }
}
