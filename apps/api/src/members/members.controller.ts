import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { GuildsService } from '../guilds/guilds.service.js';
import { DiscordRestService } from '../discord/discord-rest.service.js';
import { MembersService } from './members.service.js';

class AddNoteDto {
  @IsString() @MaxLength(2000) content!: string;
}

@ApiTags('Members')
@Controller('guilds/:id/members')
export class MembersController {
  constructor(
    private readonly guilds: GuildsService,
    private readonly members: MembersService,
    private readonly rest: DiscordRestService,
  ) {}

  /** List or search members. */
  @Get()
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Query('search') search?: string,
    @Query('after') after?: string,
    @Query('limit') limit?: string,
  ) {
    await this.guilds.assertAccess(user.id, id);
    return this.members.list(id, {
      search: search?.trim() || undefined,
      after,
      limit: limit ? Number(limit) : undefined,
    });
  }

  /** The guild's roles (for rendering member role chips and pickers). */
  @Get('roles')
  async roles(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    await this.guilds.assertAccess(user.id, id);
    return this.rest.listRoles(id);
  }

  /** Full member profile. */
  @Get(':userId')
  async profile(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    await this.guilds.assertAccess(user.id, id);
    const profile = await this.members.getProfile(id, userId);
    if (!profile) throw new NotFoundException('Member not found in this guild.');
    return profile;
  }

  @Post(':userId/notes')
  async addNote(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() dto: AddNoteDto,
  ) {
    await this.guilds.assertAccess(user.id, id);
    return this.members.addNote(id, userId, user.id, dto.content);
  }

  @Delete(':userId/notes/:noteId')
  async deleteNote(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('noteId') noteId: string,
  ) {
    await this.guilds.assertAccess(user.id, id);
    await this.members.deleteNote(id, noteId);
    return { ok: true };
  }
}
