import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';
import type { ManagedMessage, UtilityModule } from '@modyrn/shared';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { GuildsService } from '../guilds/guilds.service.js';
import { DiscordRestService } from '../discord/discord-rest.service.js';
import { UtilityService } from './utility.service.js';

class SetConfigDto {
  @IsOptional() @IsBoolean() enabled?: boolean;
  @IsOptional() @IsObject() config?: Record<string, unknown>;
}
class SaveTemplateDto {
  @IsString() @MaxLength(100) name!: string;
  @IsObject() message!: ManagedMessage;
}
class SendMessageDto {
  @IsString() channelId!: string;
  @IsObject() message!: ManagedMessage;
}
class ReactionRoleDto {
  @IsString() channelId!: string;
  @IsOptional() @IsString() messageId?: string;
  @IsOptional() @IsString() type?: string;
  @IsOptional() @IsBoolean() exclusive?: boolean;
  @IsArray() mappings!: { key: string; roleId: string; label?: string }[];
}

@ApiTags('Utility')
@Controller('guilds/:id/utility')
export class UtilityController {
  constructor(
    private readonly guilds: GuildsService,
    private readonly utility: UtilityService,
    private readonly rest: DiscordRestService,
  ) {}

  @Get()
  async overview(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    await this.guilds.assertAccess(user.id, id);
    const [configs, channels, roles] = await Promise.all([
      this.utility.listConfigs(id),
      this.rest.listChannels(id),
      this.rest.listRoles(id),
    ]);
    return { configs, channels, roles };
  }

  @Put('config/:module')
  async setConfig(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('module') module: string,
    @Body() dto: SetConfigDto,
  ) {
    await this.guilds.assertAccess(user.id, id);
    return this.utility.setConfig(id, module as UtilityModule, dto);
  }

  // Embed builder --------------------------------------------------------------

  @Get('templates')
  async templates(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    await this.guilds.assertAccess(user.id, id);
    return this.utility.listTemplates(id);
  }

  @Post('templates')
  async saveTemplate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: SaveTemplateDto,
  ) {
    await this.guilds.assertAccess(user.id, id);
    return this.utility.saveTemplate(id, dto);
  }

  @Delete('templates/:templateId')
  async deleteTemplate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('templateId') templateId: string,
  ) {
    await this.guilds.assertAccess(user.id, id);
    await this.utility.deleteTemplate(id, templateId);
    return { ok: true };
  }

  @Post('send')
  async send(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
  ) {
    await this.guilds.assertAccess(user.id, id);
    return this.utility.sendMessage(dto.channelId, dto.message);
  }

  // Reaction roles -------------------------------------------------------------

  @Get('reaction-roles')
  async reactionRoles(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    await this.guilds.assertAccess(user.id, id);
    return this.utility.listReactionRoles(id);
  }

  @Post('reaction-roles')
  async createReactionRole(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ReactionRoleDto,
  ) {
    await this.guilds.assertAccess(user.id, id);
    return this.utility.createReactionRole(id, dto);
  }

  @Delete('reaction-roles/:rrId')
  async deleteReactionRole(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('rrId') rrId: string,
  ) {
    await this.guilds.assertAccess(user.id, id);
    await this.utility.deleteReactionRole(id, rrId);
    return { ok: true };
  }
}
