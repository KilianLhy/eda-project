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
@Controller('api/v1/tasks')
export class TaskControllerV1 {
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
    return new TaskDto(task);
  }

  @Get()
  async listTasks(@Query('projectId') projectId: string) {
    const tasks = await this.taskService.listTasks(projectId);
    return TaskDto.fromEntities(tasks);
  }

  @Patch(':taskId/move')
  async moveTask(
    @Param('taskId') taskId: string,
    @Body() body: MoveTaskDto,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    const task = await this.taskService.moveTask(taskId, body.status, user.id);
    return new TaskDto(task);
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
    return new TaskDto(task);
  }
}
