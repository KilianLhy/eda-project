import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUserDecorator } from '../shared/presentation/current-user.decorator';
import type { CurrentUser } from '../shared/presentation/current-user.decorator';
import { NotificationPreferenceService } from './notification-preference.service';

interface UpdateNotificationPreferenceDto {
  emailEnabled?: boolean;
  inAppEnabled?: boolean;
}

@UseGuards(JwtAuthGuard)
@Controller('notification-preferences')
export class NotificationPreferenceController {
  constructor(
    private readonly notificationPreferenceService: NotificationPreferenceService,
  ) {}

  @Get('me')
  async getMyPreferences(@CurrentUserDecorator() user: CurrentUser) {
    return this.notificationPreferenceService.getPreferences(user.id);
  }

  @Patch('me')
  async updateMyPreferences(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() body: UpdateNotificationPreferenceDto,
  ) {
    return this.notificationPreferenceService.updatePreferences(user.id, {
      emailEnabled: body.emailEnabled ?? true,
      inAppEnabled: body.inAppEnabled ?? true,
    });
  }
}
