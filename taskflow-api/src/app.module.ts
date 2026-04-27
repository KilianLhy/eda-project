import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ProjectControllerV1 } from './api/v1/project.controller';
import { TaskControllerV1 } from './api/v1/task.controller';
import { ProjectControllerV2 } from './api/v2/project.controller';
import { TaskControllerV2 } from './api/v2/task.controller';
import { InMemoryEventBus } from './shared/infrastructure/in-memory-event-bus';
import { PROJECT_REPOSITORY } from './project/domain/project.repository';
import { TASK_REPOSITORY } from './task/domain/task.repository';
import { USER_REPOSITORY } from './user/domain/user.repository';
import { OrmProjectRepository } from './project/infrastructure/orm-project.repository';
import { OrmTaskRepository } from './task/infrastructure/orm-task.repository';
import { OrmUserRepository } from './user/infrastructure/orm-user.repository';
import { ProjectService } from './project/application/project.service';
import { TaskService } from './task/application/task.service';
import { ConsoleTaskEventHandler } from './task/infrastructure/console-task-event.handler';
import { EVENT_BUS } from './shared/domain/event-bus.port';
import { PrismaService } from './shared/infrastructure/prisma.service';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { TaskRealtimeGateway } from './realtime/task-realtime.gateway';
import { REALTIME_BROADCASTER } from './realtime/realtime-broadcaster.port';
import { TaskMovedRealtimeHandler } from './realtime/task-moved-realtime.handler';
import { TaskAssignedRealtimeHandler } from './realtime/task-assigned-realtime.handler';
import { NoopRealtimeBroadcaster } from './realtime/noop-realtime-broadcaster';
import { NotificationPreferenceController } from './notification/notification-preference.controller';
import { NotificationPreferenceService } from './notification/notification-preference.service';
import { TaskNotificationHandler } from './notification/task-notification.handler';
import { EmailNotificationChannel } from './notification/email-notification.channel';
import { InAppNotificationChannel } from './notification/in-app-notification.channel';
import {
  EMAIL_NOTIFICATION_CHANNEL,
  IN_APP_NOTIFICATION_CHANNEL,
} from './notification/notification.tokens';
import { FAILED_MESSAGE_QUEUE } from './notification/failed-message-queue.port';
import { PrismaFailedMessageQueue } from './notification/prisma-failed-message-queue';
import { AuditLogHandler } from './audit/audit-log.handler';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'dev-secret',
      signOptions: {
        expiresIn: '1h',
      },
    }),
  ],
  controllers: [
    AuthController,
    ProjectControllerV1,
    TaskControllerV1,
    ProjectControllerV2,
    TaskControllerV2,
    NotificationPreferenceController,
  ],
  providers: [
    AuthService,
    JwtAuthGuard,
    ProjectService,
    TaskService,
    NotificationPreferenceService,
    ConsoleTaskEventHandler,
    TaskMovedRealtimeHandler,
    TaskAssignedRealtimeHandler,
    TaskNotificationHandler,
    AuditLogHandler,
    PrismaService,
    InMemoryEventBus,
    TaskRealtimeGateway,
    NoopRealtimeBroadcaster,
    EmailNotificationChannel,
    InAppNotificationChannel,
    PrismaFailedMessageQueue,
    {
      provide: EMAIL_NOTIFICATION_CHANNEL,
      useExisting: EmailNotificationChannel,
    },
    {
      provide: IN_APP_NOTIFICATION_CHANNEL,
      useExisting: InAppNotificationChannel,
    },
    {
      provide: FAILED_MESSAGE_QUEUE,
      useExisting: PrismaFailedMessageQueue,
    },
    {
      provide: REALTIME_BROADCASTER,
      useFactory: (
        gateway: TaskRealtimeGateway,
        noop: NoopRealtimeBroadcaster,
      ) => (process.env.NODE_ENV === 'cli' ? noop : gateway),
      inject: [TaskRealtimeGateway, NoopRealtimeBroadcaster],
    },
    {
      provide: PROJECT_REPOSITORY,
      useClass: OrmProjectRepository,
    },
    {
      provide: TASK_REPOSITORY,
      useClass: OrmTaskRepository,
    },
    {
      provide: USER_REPOSITORY,
      useClass: OrmUserRepository,
    },
    {
      provide: EVENT_BUS,
      useExisting: InMemoryEventBus,
    },
  ],
})
export class AppModule {}
