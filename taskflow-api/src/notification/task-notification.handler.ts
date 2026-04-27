import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { EVENT_BUS } from '../shared/domain/event-bus.port';
import type { EventBusPort } from '../shared/domain/event-bus.port';
import { DomainEvent } from '../shared/domain/domain-event';
import { PrismaService } from '../shared/infrastructure/prisma.service';
import { NotificationContext } from './notification-channel.port';
import type { NotificationChannelPort } from './notification-channel.port';
import { PROJECT_REPOSITORY } from '../project/domain/project.repository';
import type { ProjectRepository } from '../project/domain/project.repository';
import {
  EMAIL_NOTIFICATION_CHANNEL,
  IN_APP_NOTIFICATION_CHANNEL,
} from './notification.tokens';

@Injectable()
export class TaskNotificationHandler implements OnModuleInit {
  constructor(
    @Inject(EVENT_BUS) private readonly eventBus: EventBusPort,
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: ProjectRepository,
    private readonly prisma: PrismaService,
    @Inject(EMAIL_NOTIFICATION_CHANNEL)
    private readonly emailChannel: NotificationChannelPort,
    @Inject(IN_APP_NOTIFICATION_CHANNEL)
    private readonly inAppChannel: NotificationChannelPort,
  ) {}

  onModuleInit(): void {
    if (process.env.NODE_ENV === 'cli') {
      return;
    }

    this.eventBus.subscribe('task.assigned', (event) => {
      void this.handleTaskAssigned(event);
    });
    this.eventBus.subscribe('task.moved', (event) => {
      void this.handleTaskMoved(event);
    });
    this.eventBus.subscribe('member.added', (event) => {
      void this.handleMemberAdded(event);
    });
  }

  private async handleTaskAssigned(event: DomainEvent): Promise<void> {
    const assigneeId =
      typeof event.payload.assigneeId === 'string'
        ? event.payload.assigneeId
        : null;
    const taskId =
      typeof event.payload.taskId === 'string' ? event.payload.taskId : null;

    if (!assigneeId || !taskId) {
      return;
    }

    await this.dispatchToUser(assigneeId, {
      userId: assigneeId,
      eventName: event.name,
      message: `Task ${taskId} vous a été assignée`,
      payload: {
        taskId,
        occurredAt: event.occurredAt,
      },
    });
  }

  private async handleTaskMoved(event: DomainEvent): Promise<void> {
    const projectId =
      typeof event.payload.projectId === 'string'
        ? event.payload.projectId
        : null;
    const taskId =
      typeof event.payload.taskId === 'string' ? event.payload.taskId : null;

    if (!projectId || !taskId) {
      return;
    }

    const project = await this.projectRepository.findById(projectId);
    if (!project) {
      return;
    }

    for (const memberId of project.memberIds) {
      await this.dispatchToUser(memberId, {
        userId: memberId,
        eventName: event.name,
        message: `Task ${taskId} déplacée (${String(event.payload.from)} -> ${String(event.payload.to)})`,
        payload: {
          taskId,
          projectId,
          from: event.payload.from,
          to: event.payload.to,
          occurredAt: event.occurredAt,
        },
      });
    }
  }

  private async handleMemberAdded(event: DomainEvent): Promise<void> {
    const memberId =
      typeof event.payload.memberId === 'string'
        ? event.payload.memberId
        : null;

    if (!memberId) {
      return;
    }

    await this.dispatchToUser(memberId, {
      userId: memberId,
      eventName: event.name,
      message: 'Vous avez été ajouté à un projet',
      payload: {
        projectId: event.payload.projectId,
        occurredAt: event.occurredAt,
      },
    });
  }

  private async dispatchToUser(
    userId: string,
    context: NotificationContext,
  ): Promise<void> {
    const preferences = await this.prisma.notificationPreference.findUnique({
      where: { userId },
    });

    const emailEnabled = preferences?.emailEnabled ?? true;
    const inAppEnabled = preferences?.inAppEnabled ?? true;

    if (emailEnabled && this.emailChannel.channelName === 'email') {
      await this.emailChannel.send(context);
    }

    if (inAppEnabled && this.inAppChannel.channelName === 'in-app') {
      await this.inAppChannel.send(context);
    }
  }
}
