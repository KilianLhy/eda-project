import { Injectable } from '@nestjs/common';
import { PrismaService } from '../shared/infrastructure/prisma.service';
import { FailedMessageQueuePort, FailedMessage } from './failed-message-queue.port';
import { NotificationContext } from './notification-channel.port';

@Injectable()
export class PrismaFailedMessageQueue implements FailedMessageQueuePort {
  constructor(private readonly prisma: PrismaService) {}

  async enqueue(
    channelName: string,
    userId: string,
    context: NotificationContext,
    error: string,
  ): Promise<void> {
    await this.prisma.failedMessage.create({
      data: {
        channelName,
        userId,
        context: context as unknown as Record<string, unknown>,
        error,
      },
    });
  }

  async findPendingMessages(): Promise<FailedMessage[]> {
    const messages = await this.prisma.failedMessage.findMany({
      orderBy: {
        failedAt: 'asc',
      },
    });

    return messages.map((msg) => ({
      id: msg.id,
      channelName: msg.channelName,
      userId: msg.userId,
      context: msg.context as unknown as NotificationContext,
      error: msg.error,
      failedAt: msg.failedAt,
      retryCount: msg.retryCount,
    }));
  }

  async markAsRetried(messageId: string): Promise<void> {
    await this.prisma.failedMessage.update({
      where: { id: messageId },
      data: {
        retryCount: { increment: 1 },
      },
    });
  }
}
