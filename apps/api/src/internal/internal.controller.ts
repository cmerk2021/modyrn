import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { ActionOrigin, ModerationActionType } from '@modyrn/shared';
import { Public } from '../auth/public.decorator.js';
import { ModerationService } from '../moderation/moderation.service.js';
import { CasesService } from '../cases/cases.service.js';
import { EventsService } from '../events/events.service.js';
import { EmergencyService } from '../emergency/emergency.service.js';
import { InternalGuard } from './internal.guard.js';
import { InternalService, type GuildSyncPayload } from './internal.service.js';

/** Payload the bot forwards for a slash-command moderation action. */
interface ActionPayload {
  guildId: string;
  action: ModerationActionType;
  moderatorId: string;
  targetUserId?: string;
  reason?: string;
  content?: string;
  count?: number;
  channelId?: string;
  durationMs?: number;
}

/**
 * Endpoints the gateway bot calls to push state and immediate actions into the
 * platform. Not part of the public API surface; protected by {@link InternalGuard}.
 */
@ApiExcludeController()
@Public()
@UseGuards(InternalGuard)
@Controller('internal')
export class InternalController {
  constructor(
    private readonly internal: InternalService,
    private readonly moderation: ModerationService,
    private readonly cases: CasesService,
    private readonly events: EventsService,
    private readonly emergency: EmergencyService,
  ) {}

  @Post('guilds/sync')
  async syncGuild(@Body() body: GuildSyncPayload) {
    await this.internal.syncGuild(body);
    return { ok: true };
  }

  @Post('guilds/left')
  async guildLeft(@Body() body: { guildId: string }) {
    await this.internal.markGuildLeft(body.guildId);
    return { ok: true };
  }

  /** Receives a normalized gateway event and routes it to automod/logging. */
  @Post('events')
  async event(@Body() body: { event: string; payload: Record<string, unknown> }) {
    await this.events.handle(body);
    return { ok: true };
  }

  /** Executes a slash-command moderation action and returns the created case. */
  @Post('actions')
  async action(@Body() body: ActionPayload) {
    const base = {
      guildId: body.guildId,
      moderatorId: body.moderatorId,
      targetUserId: body.targetUserId ?? '',
      reason: body.reason,
      origin: ActionOrigin.Command,
    };

    switch (body.action) {
      case ModerationActionType.Warn:
        return this.moderation.warn(base);
      case ModerationActionType.Timeout:
        return this.moderation.timeout({ ...base, durationMs: body.durationMs ?? 600_000 });
      case ModerationActionType.Kick:
        return this.moderation.kick(base);
      case ModerationActionType.Ban:
        return this.moderation.ban({ ...base, durationMs: body.durationMs });
      case ModerationActionType.Unban:
        return this.moderation.unban(base);
      case ModerationActionType.Quarantine:
        return this.moderation.quarantine(base);
      case ModerationActionType.Note:
        return this.moderation.note({ ...base, content: body.content ?? '' });
      case ModerationActionType.Purge:
        return this.moderation.purge({
          guildId: body.guildId,
          moderatorId: body.moderatorId,
          channelId: body.channelId ?? '',
          count: body.count ?? 10,
          targetUserId: body.targetUserId,
          reason: body.reason,
          origin: ActionOrigin.Command,
        });
      default:
        return { ok: false, error: 'Unsupported action' };
    }
  }

  /** Locks or unlocks the current channel for the `/lock` and `/unlock` commands. */
  @Post('lock')
  async lock(
    @Body() body: { guildId: string; channelId: string; locked: boolean; moderatorId: string },
  ) {
    return this.emergency.setChannelLock(
      body.guildId,
      body.channelId,
      body.locked,
      body.moderatorId,
    );
  }

  /** Looks up a case by its per-guild number for the `/case` command. */
  @Post('case-lookup')
  async caseLookup(@Body() body: { guildId: string; caseNumber: number }) {
    const found = await this.cases.getByNumber(body.guildId, body.caseNumber);
    if (!found) return { found: false };
    return {
      found: true,
      summary: `Case #${found.caseNumber} · ${found.action} · <@${found.targetUserId}> — ${found.reason ?? 'No reason'}`,
    };
  }
}
