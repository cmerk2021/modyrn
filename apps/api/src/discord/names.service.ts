import { Injectable } from '@nestjs/common';
import { and, eq, guildMembers, inArray, type Database } from '@modyrn/database';
import { InjectDatabase } from '../database/inject-database.decorator.js';
import { DiscordRestService } from './discord-rest.service.js';

/**
 * Resolves raw Discord IDs to human-readable names for dashboard display.
 * User names come from the cached member snapshot (no Discord round-trip);
 * channel and role names are fetched from the REST API and memoised briefly so
 * repeated lookups within a request stay cheap.
 */
@Injectable()
export class NamesService {
  constructor(
    @InjectDatabase() private readonly db: Database,
    private readonly rest: DiscordRestService,
  ) {}

  /**
   * Maps user IDs to a display name (nickname → global name → username).
   * Unknown users are omitted; callers should fall back to the raw ID.
   */
  async userNames(guildId: string, userIds: string[]): Promise<Record<string, string>> {
    const unique = [...new Set(userIds.filter(Boolean))];
    if (unique.length === 0) return {};
    const rows = await this.db
      .select({
        userId: guildMembers.userId,
        username: guildMembers.username,
        globalName: guildMembers.globalName,
        nickname: guildMembers.nickname,
      })
      .from(guildMembers)
      .where(and(eq(guildMembers.guildId, guildId), inArray(guildMembers.userId, unique)));
    const map: Record<string, string> = {};
    for (const row of rows) {
      map[row.userId] = row.nickname || row.globalName || row.username;
    }
    return map;
  }

  /** Maps channel IDs to their names for the given guild. */
  async channelNames(guildId: string): Promise<Record<string, string>> {
    const channels = await this.rest.listChannels(guildId);
    const map: Record<string, string> = {};
    for (const channel of channels) map[channel.id] = channel.name;
    return map;
  }

  /** Maps role IDs to their names for the given guild. */
  async roleNames(guildId: string): Promise<Record<string, string>> {
    const roles = await this.rest.listRoles(guildId);
    const map: Record<string, string> = {};
    for (const role of roles) map[role.id] = role.name;
    return map;
  }
}
