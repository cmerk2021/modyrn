import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { eq, guilds, type Database, type Guild } from '@modyrn/database';
import type { ComplexityMode } from '@modyrn/shared';
import { InjectDatabase } from '../database/inject-database.decorator.js';
import { AuthService } from '../auth/auth.service.js';
import { DiscordOAuthService } from '../auth/discord-oauth.service.js';
import { DiscordRestService } from '../discord/discord-rest.service.js';
import type { UpdateGuildSettingsDto } from './dto/update-guild-settings.dto.js';

export interface ManageableGuild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  /** Whether the Modyrn bot is present in this guild. */
  botPresent: boolean;
  setupCompleted: boolean;
  /** Invite URL to add the bot to this specific guild. */
  inviteUrl: string;
}

/** Bot-presence status for a guild, used to gate the dashboard. */
export interface GuildAccess {
  botPresent: boolean;
  inviteUrl: string;
}

/**
 * Guild access and settings. Access is derived from the user's Discord
 * permissions (owner / administrator / Manage Server), cross-referenced with the
 * guilds Modyrn is installed in.
 */
@Injectable()
export class GuildsService {
  constructor(
    @InjectDatabase() private readonly db: Database,
    private readonly auth: AuthService,
    private readonly discord: DiscordOAuthService,
    private readonly rest: DiscordRestService,
  ) {}

  /** Lists guilds the user can manage, annotated with Modyrn install state. */
  async listManageable(userId: string): Promise<ManageableGuild[]> {
    const accessToken = await this.auth.getAccessToken(userId);
    if (!accessToken) return [];

    const discordGuilds = (await this.discord.fetchGuilds(accessToken)).filter((g) =>
      this.discord.canManageGuild(g),
    );

    const installed = await this.db.select().from(guilds);
    const installedById = new Map(installed.map((g) => [g.id, g]));

    return discordGuilds.map((g) => {
      const record = installedById.get(g.id);
      return {
        id: g.id,
        name: g.name,
        icon: g.icon,
        owner: g.owner,
        botPresent: record?.botPresent ?? false,
        setupCompleted: record?.setupCompleted ?? false,
        inviteUrl: this.rest.botInviteUrl(g.id),
      };
    });
  }

  /**
   * Verifies the user can manage the guild. Throws {@link ForbiddenException}
   * otherwise. Returns the set of manageable guild IDs for reuse.
   */
  async assertAccess(userId: string, guildId: string): Promise<void> {
    const accessToken = await this.auth.getAccessToken(userId);
    const discordGuilds = accessToken ? await this.discord.fetchGuilds(accessToken) : [];
    const canManage = discordGuilds.some((g) => g.id === guildId && this.discord.canManageGuild(g));
    if (!canManage) {
      throw new ForbiddenException('You do not have access to manage this guild.');
    }
  }

  /**
   * Real-time bot-presence check for a guild (via the bot token), plus the
   * invite URL to add it. Drives the dashboard's "invite the bot" gate.
   */
  async getAccess(guildId: string): Promise<GuildAccess> {
    const botPresent = await this.rest.isBotInGuild(guildId);
    return { botPresent, inviteUrl: this.rest.botInviteUrl(guildId) };
  }

  /** Guild roles and channels for dashboard pickers. */
  async getMeta(guildId: string) {
    const [roles, channels] = await Promise.all([
      this.rest.listRoles(guildId),
      this.rest.listChannels(guildId),
    ]);
    return { roles, channels };
  }

  /** Returns a guild record, throwing if Modyrn is not installed there. */
  async getGuild(guildId: string): Promise<Guild> {
    const [guild] = await this.db.select().from(guilds).where(eq(guilds.id, guildId)).limit(1);
    if (!guild) {
      throw new NotFoundException('Modyrn is not installed in this guild yet.');
    }
    return guild;
  }

  /** Updates a guild's settings, merging into the JSON settings blob. */
  async updateSettings(guildId: string, dto: UpdateGuildSettingsDto): Promise<Guild> {
    const guild = await this.getGuild(guildId);

    const settings = {
      ...guild.settings,
      ...(dto.modLogChannelId !== undefined ? { modLogChannelId: dto.modLogChannelId } : {}),
      ...(dto.quarantineRoleId !== undefined ? { quarantineRoleId: dto.quarantineRoleId } : {}),
      ...(dto.timezone !== undefined ? { timezone: dto.timezone } : {}),
      ...(dto.dmOnAction !== undefined ? { dmOnAction: dto.dmOnAction } : {}),
    };

    const [updated] = await this.db
      .update(guilds)
      .set({
        settings,
        ...(dto.complexityMode ? { complexityMode: dto.complexityMode as ComplexityMode } : {}),
        updatedAt: new Date(),
      })
      .where(eq(guilds.id, guildId))
      .returning();

    return updated!;
  }
}
