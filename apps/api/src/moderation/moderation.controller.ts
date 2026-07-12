import { Body, Controller, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ActionOrigin } from '@modyrn/shared';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { GuildsService } from '../guilds/guilds.service.js';
import { ModerationService } from './moderation.service.js';
import {
  BanDto,
  KickDto,
  NicknameDto,
  NoteDto,
  PurgeDto,
  QuarantineDto,
  RoleActionDto,
  TimeoutDto,
  UnbanDto,
  WarnDto,
} from './dto/action.dto.js';

@ApiTags('Moderation')
@Controller('guilds/:id/actions')
export class ModerationController {
  constructor(
    private readonly guilds: GuildsService,
    private readonly moderation: ModerationService,
  ) {}

  private async ctx(user: AuthenticatedUser, guildId: string) {
    await this.guilds.assertAccess(user.id, guildId);
    return { guildId, moderatorId: user.id, origin: ActionOrigin.Dashboard };
  }

  @Post('warn')
  async warn(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: WarnDto,
  ) {
    return this.moderation.warn({ ...(await this.ctx(user, id)), ...dto });
  }

  @Post('timeout')
  async timeout(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: TimeoutDto,
  ) {
    return this.moderation.timeout({ ...(await this.ctx(user, id)), ...dto });
  }

  @Post('remove-timeout')
  async removeTimeout(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: WarnDto,
  ) {
    return this.moderation.removeTimeout({ ...(await this.ctx(user, id)), ...dto });
  }

  @Post('kick')
  async kick(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: KickDto,
  ) {
    return this.moderation.kick({ ...(await this.ctx(user, id)), ...dto });
  }

  @Post('ban')
  async ban(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: BanDto) {
    return this.moderation.ban({ ...(await this.ctx(user, id)), ...dto });
  }

  @Post('unban')
  async unban(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UnbanDto,
  ) {
    return this.moderation.unban({ ...(await this.ctx(user, id)), ...dto });
  }

  @Post('softban')
  async softban(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: KickDto,
  ) {
    return this.moderation.softban({ ...(await this.ctx(user, id)), ...dto });
  }

  @Post('quarantine')
  async quarantine(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: QuarantineDto,
  ) {
    return this.moderation.quarantine({ ...(await this.ctx(user, id)), ...dto });
  }

  @Post('unquarantine')
  async unquarantine(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UnbanDto,
  ) {
    return this.moderation.unquarantine({ ...(await this.ctx(user, id)), ...dto });
  }

  @Post('note')
  async note(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: NoteDto,
  ) {
    return this.moderation.note({ ...(await this.ctx(user, id)), ...dto });
  }

  @Post('role')
  async role(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: RoleActionDto,
  ) {
    return this.moderation.setRole({ ...(await this.ctx(user, id)), ...dto });
  }

  @Post('nickname')
  async nickname(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: NicknameDto,
  ) {
    return this.moderation.setNickname({ ...(await this.ctx(user, id)), ...dto });
  }

  @Post('purge')
  async purge(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: PurgeDto,
  ) {
    return this.moderation.purge({ ...(await this.ctx(user, id)), ...dto });
  }
}
