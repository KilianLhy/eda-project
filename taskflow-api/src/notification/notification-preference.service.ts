import { Injectable } from '@nestjs/common';
import { PrismaService } from '../shared/infrastructure/prisma.service';

export interface NotificationPreferencesDto {
  emailEnabled: boolean;
  inAppEnabled: boolean;
}

@Injectable()
export class NotificationPreferenceService {
  constructor(private readonly prisma: PrismaService) {}

  async getPreferences(userId: string): Promise<NotificationPreferencesDto> {
    const preferences = await this.prisma.notificationPreference.findUnique({
      where: {
        userId,
      },
    });

    if (!preferences) {
      return {
        emailEnabled: true,
        inAppEnabled: true,
      };
    }

    return {
      emailEnabled: preferences.emailEnabled,
      inAppEnabled: preferences.inAppEnabled,
    };
  }

  async updatePreferences(
    userId: string,
    data: NotificationPreferencesDto,
  ): Promise<NotificationPreferencesDto> {
    const preferences = await this.prisma.notificationPreference.upsert({
      where: {
        userId,
      },
      update: {
        emailEnabled: data.emailEnabled,
        inAppEnabled: data.inAppEnabled,
      },
      create: {
        userId,
        emailEnabled: data.emailEnabled,
        inAppEnabled: data.inAppEnabled,
      },
    });

    return {
      emailEnabled: preferences.emailEnabled,
      inAppEnabled: preferences.inAppEnabled,
    };
  }
}
