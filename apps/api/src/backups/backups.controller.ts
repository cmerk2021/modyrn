import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsObject } from 'class-validator';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { GuildsService } from '../guilds/guilds.service.js';
import { BackupsService, type ConfigBackup } from './backups.service.js';

class RestoreDto {
  @IsObject() backup!: ConfigBackup;
}

@ApiTags('Backups')
@Controller('guilds/:id/backups')
export class BackupsController {
  constructor(
    private readonly guilds: GuildsService,
    private readonly backups: BackupsService,
  ) {}

  @Get()
  async list(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    await this.guilds.assertAccess(user.id, id);
    return this.backups.list(id);
  }

  @Post('export')
  async export(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    await this.guilds.assertAccess(user.id, id);
    return this.backups.export(id);
  }

  @Post('restore')
  async restore(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: RestoreDto,
  ) {
    await this.guilds.assertAccess(user.id, id);
    return this.backups.restore(id, dto.backup);
  }
}
