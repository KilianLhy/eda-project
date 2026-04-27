import { Injectable } from '@nestjs/common';
import {
  NotificationChannelPort,
  NotificationContext,
} from './notification-channel.port';

@Injectable()
export class EmailNotificationChannel implements NotificationChannelPort {
  readonly channelName = 'email' as const;

  async send(context: NotificationContext): Promise<void> {
    // Simplified for this delivery: simulate email sending via logs.
    console.log(
      `[notification.email] userId=${context.userId} event=${context.eventName} message=${context.message}`,
    );
  }
}
