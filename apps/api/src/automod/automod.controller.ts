import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { GuildsService } from '../guilds/guilds.service.js';
import { AutomodService, type AutomodPresetKey } from './automod.service.js';
import { UpsertAutomodRuleDto } from './dto/automod-rule.dto.js';

@ApiTags('Automod')
@Controller('guilds/:id/automod')
export class AutomodController {
  constructor(
    private readonly guilds: GuildsService,
    private readonly automod: AutomodService,
  ) {}

  @Get()
  async list(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    await this.guilds.assertAccess(user.id, id);
    return this.automod.list(id);
  }

  @Get('presets')
  async presets(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    await this.guilds.assertAccess(user.id, id);
    return this.automod.listPresets();
  }

  @Post('presets/:key')
  async applyPreset(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('key') key: string,
  ) {
    await this.guilds.assertAccess(user.id, id);
    return this.automod.applyPreset(id, key as AutomodPresetKey);
  }

  @Get('events')
  async events(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    await this.guilds.assertAccess(user.id, id);
    return this.automod.recentEvents(id);
  }

  @Post()
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpsertAutomodRuleDto,
  ) {
    await this.guilds.assertAccess(user.id, id);
    const [rule] = await this.automod.create(id, dto);
    return rule;
  }

  @Get(':ruleId')
  async get(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('ruleId') ruleId: string,
  ) {
    await this.guilds.assertAccess(user.id, id);
    return this.automod.get(id, ruleId);
  }

  @Patch(':ruleId')
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('ruleId') ruleId: string,
    @Body() dto: Partial<UpsertAutomodRuleDto>,
  ) {
    await this.guilds.assertAccess(user.id, id);
    return this.automod.update(id, ruleId, dto);
  }

  @Delete(':ruleId')
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('ruleId') ruleId: string,
  ) {
    await this.guilds.assertAccess(user.id, id);
    await this.automod.remove(id, ruleId);
    return { ok: true };
  }
}
