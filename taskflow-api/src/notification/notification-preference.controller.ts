import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { PrismaService } from '../shared/infrastructure/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUserDecorator } from '../shared/presentation/current-user.decorator';
import type { CurrentUser } from '../shared/presentation/current-user.decorator';

interface UpdateNotificationPreferenceDto {
  emailEnabled?: boolean;
  inAppEnabled?: boolean;
}

@UseGuards(JwtAuthGuard)
@Controller('notification-preferences')
export class NotificationPreferenceController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('me')
  async getMyPreferences(@CurrentUserDecorator() user: CurrentUser) {
    const preferences = await this.prisma.notificationPreference.findUnique({
      where: { userId: user.id },
    });

    return (
      preferences ?? {
        userId: user.id,
        emailEnabled: true,
        inAppEnabled: true,
      }
    );
  }

  @Patch('me')
  async updateMyPreferences(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() body: UpdateNotificationPreferenceDto,
  ) {
    return this.prisma.notificationPreference.upsert({
      where: { userId: user.id },
      update: {
        emailEnabled: body.emailEnabled,
        inAppEnabled: body.inAppEnabled,
      },
      create: {
        userId: user.id,
        emailEnabled: body.emailEnabled ?? true,
        inAppEnabled: body.inAppEnabled ?? true,
      },
    });
  }
}
