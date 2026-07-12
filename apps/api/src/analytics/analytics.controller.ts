import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { GuildsService } from '../guilds/guilds.service.js';
import { AnalyticsService } from './analytics.service.js';

@ApiTags('Analytics')
@Controller('guilds/:id/analytics')
export class AnalyticsController {
  constructor(
    private readonly guilds: GuildsService,
    private readonly analytics: AnalyticsService,
  ) {}

  @Get()
  async report(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Query('days') days?: string,
  ) {
    await this.guilds.assertAccess(user.id, id);
    return this.analytics.report(id, days ? Math.min(90, Number(days)) : 14);
  }
}
