import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { TaskService } from '../application/task.service';
import { TaskStatusValue } from '../domain/task-status.vo';
import { TaskDto } from './task.dto';

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

@Controller('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  async createTask(
    @Body() body: CreateTaskDto,
    @Headers('x-user-id') userId?: string,
  ) {
    const task = await this.taskService.createTask({
      projectId: body.projectId,
      title: body.title,
      assigneeId: body.assigneeId,
      actorId: userId ?? 'demo-user',
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
    @Headers('x-user-id') userId?: string,
  ) {
    const task = await this.taskService.moveTask(
      taskId,
      body.status,
      userId ?? 'demo-user',
    );
    return new TaskDto(task);
  }

  @Patch(':taskId/assign')
  async assignTask(
    @Param('taskId') taskId: string,
    @Body() body: AssignTaskDto,
    @Headers('x-user-id') userId?: string,
  ) {
    const task = await this.taskService.assignTask(
      taskId,
      body.assigneeId,
      userId ?? 'demo-user',
    );
    return new TaskDto(task);
  }
}
