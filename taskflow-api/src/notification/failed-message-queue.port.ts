import { NotificationContext } from './notification-channel.port';

export interface FailedMessage {
  id: string;
  channelName: string;
  userId: string;
  context: NotificationContext;
  error: string;
  failedAt: Date;
  retryCount: number;
}

export interface FailedMessageQueuePort {
  enqueue(
    channelName: string,
    userId: string,
    context: NotificationContext,
    error: string,
  ): Promise<void>;
  findPendingMessages(): Promise<FailedMessage[]>;
  markAsRetried(messageId: string): Promise<void>;
}

export const FAILED_MESSAGE_QUEUE = Symbol('FAILED_MESSAGE_QUEUE');
