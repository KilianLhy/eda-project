export interface NotificationContext {
  userId: string;
  eventName: string;
  message: string;
  payload: Record<string, unknown>;
}

export interface NotificationChannelPort {
  readonly channelName: 'email' | 'in-app';
  send(context: NotificationContext): Promise<void>;
}
