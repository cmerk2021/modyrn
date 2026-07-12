import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import type { LogEventType } from '@modyrn/shared';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { GuildsService } from '../guilds/guilds.service.js';
import { DiscordRestService } from '../discord/discord-rest.service.js';
import { LoggingService } from './logging.service.js';

class UpdateLogSettingDto {
  @IsOptional() @IsBoolean() enabled?: boolean;
  @IsOptional() @IsString() channelId?: string | null;
}

@ApiTags('Logging')
@Controller('guilds/:id/logging')
export class LoggingController {
  constructor(
    private readonly guilds: GuildsService,
    private readonly logging: LoggingService,
    private readonly rest: DiscordRestService,
  ) {}

  @Get()
  async get(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    await this.guilds.assertAccess(user.id, id);
    const [settings, channels] = await Promise.all([
      this.logging.getSettings(id),
      this.rest.listChannels(id),
    ]);
    return { settings, channels };
  }

  @Patch(':eventType')
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('eventType') eventType: string,
    @Body() dto: UpdateLogSettingDto,
  ) {
    await this.guilds.assertAccess(user.id, id);
    return this.logging.upsert(id, eventType as LogEventType, dto);
  }
}
