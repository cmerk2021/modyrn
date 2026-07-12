import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { QuarantineTarget } from '@modyrn/shared';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { GuildsService } from '../guilds/guilds.service.js';
import { DiscordRestService } from '../discord/discord-rest.service.js';
import { EmergencyService } from './emergency.service.js';

class ToggleDto {
  @IsBoolean() enabled!: boolean;
}
class LockDto {
  @IsString() channelId!: string;
  @IsBoolean() locked!: boolean;
}
class SlowmodeDto {
  @IsString() channelId!: string;
  @IsInt() @Min(0) @Max(21600) seconds!: number;
}
class AnnounceDto {
  @IsString() channelId!: string;
  @IsString() @MaxLength(2000) message!: string;
}
class MassActionDto {
  @IsIn(['ban', 'kick', 'quarantine']) action!: 'ban' | 'kick' | 'quarantine';
  @IsArray() targetUserIds!: string[];
  @IsOptional() @IsString() @MaxLength(2000) reason?: string;
}
class CreateProfileDto {
  @IsString() @MaxLength(100) name!: string;
  @IsOptional() @IsString() @MaxLength(500) description?: string;
  @IsIn(Object.values(QuarantineTarget)) target!: QuarantineTarget;
  @IsString() quarantineRoleId!: string;
  @IsOptional() @IsBoolean() stripRoles?: boolean;
  @IsOptional() @IsInt() durationMinutes?: number;
}

@ApiTags('Emergency')
@Controller('guilds/:id/emergency')
export class EmergencyController {
  constructor(
    private readonly guilds: GuildsService,
    private readonly emergency: EmergencyService,
    private readonly rest: DiscordRestService,
  ) {}

  @Get()
  async state(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    await this.guilds.assertAccess(user.id, id);
    const [state, channels, profiles] = await Promise.all([
      this.emergency.getState(id),
      this.rest.listChannels(id),
      this.emergency.listProfiles(id),
    ]);
    return { state, channels, profiles };
  }

  @Post('raid-mode')
  async raidMode(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ToggleDto,
  ) {
    await this.guilds.assertAccess(user.id, id);
    return this.emergency.setRaidMode(id, dto.enabled, user.id);
  }

  @Post('freeze')
  async freeze(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ToggleDto,
  ) {
    await this.guilds.assertAccess(user.id, id);
    return this.emergency.setChatFrozen(id, dto.enabled, user.id);
  }

  @Post('invites')
  async invites(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ToggleDto,
  ) {
    await this.guilds.assertAccess(user.id, id);
    return this.emergency.setInviteRestriction(id, dto.enabled, user.id);
  }

  @Post('lock')
  async lock(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: LockDto,
  ) {
    await this.guilds.assertAccess(user.id, id);
    return this.emergency.setChannelLock(id, dto.channelId, dto.locked, user.id);
  }

  @Post('slowmode')
  async slowmode(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: SlowmodeDto,
  ) {
    await this.guilds.assertAccess(user.id, id);
    return this.emergency.setSlowmode(id, dto.channelId, dto.seconds, user.id);
  }

  @Post('announce')
  async announce(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: AnnounceDto,
  ) {
    await this.guilds.assertAccess(user.id, id);
    return this.emergency.announce(dto.channelId, dto.message);
  }

  @Post('mass-action')
  async massAction(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: MassActionDto,
  ) {
    await this.guilds.assertAccess(user.id, id);
    return this.emergency.massAction(id, user.id, dto.action, dto.targetUserIds, dto.reason);
  }

  @Get('profiles')
  async profiles(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    await this.guilds.assertAccess(user.id, id);
    return this.emergency.listProfiles(id);
  }

  @Post('profiles')
  async createProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CreateProfileDto,
  ) {
    await this.guilds.assertAccess(user.id, id);
    return this.emergency.createProfile(id, dto);
  }

  @Delete('profiles/:profileId')
  async deleteProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('profileId') profileId: string,
  ) {
    await this.guilds.assertAccess(user.id, id);
    await this.emergency.deleteProfile(id, profileId);
    return { ok: true };
  }
}
