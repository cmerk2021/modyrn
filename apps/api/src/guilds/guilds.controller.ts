import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { GuildsService } from './guilds.service.js';
import { OverviewService } from './overview.service.js';
import { UpdateGuildSettingsDto } from './dto/update-guild-settings.dto.js';

@ApiTags('Guilds')
@Controller('guilds')
export class GuildsController {
  constructor(
    private readonly guilds: GuildsService,
    private readonly overview: OverviewService,
  ) {}

  /** Guilds the current user can manage. */
  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.guilds.listManageable(user.id);
  }

  /** Live overview payload (metrics, activity, recent cases). */
  @Get(':id/overview')
  async getOverview(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    await this.guilds.assertAccess(user.id, id);
    return this.overview.getOverview(id);
  }

  /** Whether the bot is in the guild, plus an invite URL if not. */
  @Get(':id/access')
  async getAccess(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    await this.guilds.assertAccess(user.id, id);
    return this.guilds.getAccess(id);
  }

  /** Guild roles and channels — used by settings, logging, utility pickers. */
  @Get(':id/meta')
  async getMeta(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    await this.guilds.assertAccess(user.id, id);
    return this.guilds.getMeta(id);
  }

  /** Overview and settings for a single guild. */
  @Get(':id')
  async get(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    await this.guilds.assertAccess(user.id, id);
    return this.guilds.getGuild(id);
  }

  /** Update guild settings. */
  @Patch(':id/settings')
  async updateSettings(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateGuildSettingsDto,
  ) {
    await this.guilds.assertAccess(user.id, id);
    return this.guilds.updateSettings(id, dto);
  }
}
