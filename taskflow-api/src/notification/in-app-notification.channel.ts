import { Injectable } from '@nestjs/common';
import { PrismaService } from '../shared/infrastructure/prisma.service';
import {
  NotificationChannelPort,
  NotificationContext,
} from './notification-channel.port';
import type { Prisma } from '@prisma/client';

@Injectable()
export class InAppNotificationChannel implements NotificationChannelPort {
  readonly channelName = 'in-app' as const;

  constructor(private readonly prisma: PrismaService) {}

  async send(context: NotificationContext): Promise<void> {
    await this.prisma.inAppNotification.create({
      data: {
        userId: context.userId,
        type: context.eventName,
        message: context.message,
        payload: context.payload as Prisma.InputJsonValue,
      },
    });
  }
}
