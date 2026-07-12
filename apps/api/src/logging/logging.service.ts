import { Injectable } from '@nestjs/common';
import { and, eq, logSettings, type Database, type LogSetting } from '@modyrn/database';
import { LOG_EVENT_TYPES, type LogEventType } from '@modyrn/shared';
import { InjectDatabase } from '../database/inject-database.decorator.js';
import { DiscordRestService } from '../discord/discord-rest.service.js';

export interface LogSettingView {
  eventType: LogEventType;
  enabled: boolean;
  channelId: string | null;
}

/** Per-event logging configuration and dispatch to Discord channels. */
@Injectable()
export class LoggingService {
  constructor(
    @InjectDatabase() private readonly db: Database,
    private readonly rest: DiscordRestService,
  ) {}

  /** Returns settings for every log event type, defaulting missing ones to off. */
  async getSettings(guildId: string): Promise<LogSettingView[]> {
    const rows = await this.db.select().from(logSettings).where(eq(logSettings.guildId, guildId));
    const byType = new Map<string, LogSetting>(rows.map((r) => [r.eventType, r]));
    return LOG_EVENT_TYPES.map((eventType) => {
      const row = byType.get(eventType);
      return {
        eventType,
        enabled: row?.enabled ?? false,
        channelId: row?.channelId ?? null,
      };
    });
  }

  async upsert(
    guildId: string,
    eventType: LogEventType,
    input: { enabled?: boolean; channelId?: string | null },
  ): Promise<LogSettingView> {
    await this.db
      .insert(logSettings)
      .values({
        guildId,
        eventType,
        enabled: input.enabled ?? false,
        channelId: input.channelId ?? null,
      })
      .onConflictDoUpdate({
        target: [logSettings.guildId, logSettings.eventType],
        set: {
          ...(input.enabled !== undefined ? { enabled: input.enabled } : {}),
          ...(input.channelId !== undefined ? { channelId: input.channelId } : {}),
          updatedAt: new Date(),
        },
      });
    const [row] = await this.db
      .select()
      .from(logSettings)
      .where(and(eq(logSettings.guildId, guildId), eq(logSettings.eventType, eventType)))
      .limit(1);
    return { eventType, enabled: row?.enabled ?? false, channelId: row?.channelId ?? null };
  }

  /** Dispatches a log embed to the configured channel if the event is enabled. */
  async dispatch(
    guildId: string,
    eventType: LogEventType,
    embed: Record<string, unknown>,
  ): Promise<void> {
    const [row] = await this.db
      .select()
      .from(logSettings)
      .where(and(eq(logSettings.guildId, guildId), eq(logSettings.eventType, eventType)))
      .limit(1);
    if (!row?.enabled || !row.channelId) return;
    await this.rest.sendMessage(row.channelId, { embeds: [embed] }).catch(() => null);
  }
}
