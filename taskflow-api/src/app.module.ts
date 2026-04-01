import { Module } from '@nestjs/common';
import { ProjectController } from './project/presentation/project.controller';
import { TaskController } from './task/presentation/task.controller';
import { InMemoryEventBus } from './shared/infrastructure/in-memory-event-bus';
import { PROJECT_REPOSITORY } from './project/domain/project.repository';
import { TASK_REPOSITORY } from './task/domain/task.repository';
import { OrmProjectRepository } from './project/infrastructure/orm-project.repository';
import { OrmTaskRepository } from './task/infrastructure/orm-task.repository';
import { ProjectService } from './project/application/project.service';
import { TaskService } from './task/application/task.service';
import { ConsoleTaskEventHandler } from './task/infrastructure/console-task-event.handler';
import { EVENT_BUS } from './shared/domain/event-bus.port';
import { PrismaService } from './shared/infrastructure/prisma.service';

@Module({
  imports: [],
  controllers: [ProjectController, TaskController],
  providers: [
    ProjectService,
    TaskService,
    ConsoleTaskEventHandler,
    PrismaService,
    InMemoryEventBus,
    {
      provide: PROJECT_REPOSITORY,
      useClass: OrmProjectRepository,
    },
    {
      provide: TASK_REPOSITORY,
      useClass: OrmTaskRepository,
    },
    {
      provide: EVENT_BUS,
      useExisting: InMemoryEventBus,
    },
  ],
})
export class AppModule {}
