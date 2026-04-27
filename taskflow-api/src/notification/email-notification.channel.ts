import { Injectable } from '@nestjs/common';
import {
  NotificationChannelPort,
  NotificationContext,
} from './notification-channel.port';

@Injectable()
export class EmailNotificationChannel implements NotificationChannelPort {
  readonly channelName = 'email' as const;

  async send(context: NotificationContext): Promise<void> {
    if (process.env.SIMULATE_EMAIL_FAILURE === 'true') {
      throw new Error('Email service is temporarily unavailable');
    }

    console.log(
      `[notification.email] userId=${context.userId} event=${context.eventName} message=${context.message}`,
    );
  }
}
