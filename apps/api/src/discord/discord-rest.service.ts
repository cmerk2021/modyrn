import { Injectable } from '@nestjs/common';
import { AppConfigService } from '../config/app-config.service.js';

const DISCORD_API = 'https://discord.com/api/v10';

/** A Discord role as returned by the REST API (subset we use). */
export interface DiscordRole {
  id: string;
  name: string;
  color: number;
  position: number;
  permissions: string;
  managed: boolean;
  hoist: boolean;
}

/** A Discord channel (subset). */
export interface DiscordChannel {
  id: string;
  name: string;
  type: number;
  position: number;
  parent_id: string | null;
}

/** A guild member (subset). */
export interface DiscordMember {
  user: {
    id: string;
    username: string;
    global_name: string | null;
    avatar: string | null;
    bot?: boolean;
  };
  nick: string | null;
  roles: string[];
  joined_at: string;
  communication_disabled_until: string | null;
}

export interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
  owner_id: string;
  approximate_member_count?: number;
  approximate_presence_count?: number;
}

/** Channel type constants we care about. */
export const ChannelType = {
  GuildText: 0,
  GuildVoice: 2,
  GuildCategory: 4,
  GuildAnnouncement: 5,
  GuildForum: 15,
} as const;

/** Permission bit for SEND_MESSAGES (used for channel lockdown). */
export const SEND_MESSAGES = 1n << 11n;

interface RequestOptions {
  method?: string;
  body?: unknown;
  reason?: string;
  /** Query string params. */
  query?: Record<string, string | number | undefined>;
}

/**
 * REST client for privileged Discord operations, authenticated with the bot
 * token. The API performs moderation actions directly through this rather than
 * round-tripping through the gateway bot, which keeps actions synchronous and
 * auditable.
 */
@Injectable()
export class DiscordRestService {
  private readonly token: string;
  private readonly clientId: string;
  private botUserIdCache: string | null = null;

  constructor(private readonly config: AppConfigService) {
    this.token = this.config.discord.token;
    this.clientId = this.config.discord.clientId;
  }

  /** Low-level request helper. Returns parsed JSON, or `null` for 204. */
  private async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const url = new URL(`${DISCORD_API}${path}`);
    if (options.query) {
      for (const [key, value] of Object.entries(options.query)) {
        if (value !== undefined) url.searchParams.set(key, String(value));
      }
    }

    const headers: Record<string, string> = {
      Authorization: `Bot ${this.token}`,
      'Content-Type': 'application/json',
    };
    if (options.reason) headers['X-Audit-Log-Reason'] = options.reason.slice(0, 500);

    const res = await fetch(url, {
      method: options.method ?? 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });

    if (res.status === 204) return undefined as T;

    const text = await res.text();
    const data = text ? JSON.parse(text) : undefined;

    if (!res.ok) {
      const message = (data as { message?: string })?.message ?? res.statusText;
      throw new DiscordApiError(res.status, message, data);
    }
    return data as T;
  }

  /** The bot's own user ID (cached). */
  async getBotUserId(): Promise<string> {
    if (this.botUserIdCache) return this.botUserIdCache;
    const me = await this.request<{ id: string }>('/users/@me');
    this.botUserIdCache = me.id;
    return me.id;
  }

  /** True when the bot is a member of the guild. */
  async isBotInGuild(guildId: string): Promise<boolean> {
    try {
      await this.request(`/guilds/${guildId}`);
      return true;
    } catch (error) {
      if (error instanceof DiscordApiError && (error.status === 403 || error.status === 404)) {
        return false;
      }
      throw error;
    }
  }

  getGuild(guildId: string): Promise<DiscordGuild> {
    return this.request<DiscordGuild>(`/guilds/${guildId}`, {
      query: { with_counts: 'true' },
    });
  }

  listRoles(guildId: string): Promise<DiscordRole[]> {
    return this.request<DiscordRole[]>(`/guilds/${guildId}/roles`);
  }

  listChannels(guildId: string): Promise<DiscordChannel[]> {
    return this.request<DiscordChannel[]>(`/guilds/${guildId}/channels`);
  }

  /** Lists members (paginated by `after` user ID, max 1000 per page). */
  listMembers(guildId: string, params: { limit?: number; after?: string } = {}) {
    return this.request<DiscordMember[]>(`/guilds/${guildId}/members`, {
      query: { limit: params.limit ?? 100, after: params.after },
    });
  }

  /** Searches members by username/nickname prefix. */
  searchMembers(guildId: string, query: string, limit = 25) {
    return this.request<DiscordMember[]>(`/guilds/${guildId}/members/search`, {
      query: { query, limit },
    });
  }

  async getMember(guildId: string, userId: string): Promise<DiscordMember | null> {
    try {
      return await this.request<DiscordMember>(`/guilds/${guildId}/members/${userId}`);
    } catch (error) {
      if (error instanceof DiscordApiError && error.status === 404) return null;
      throw error;
    }
  }

  // --- Moderation actions ----------------------------------------------------

  ban(guildId: string, userId: string, opts: { reason?: string; deleteMessageSeconds?: number }) {
    return this.request(`/guilds/${guildId}/bans/${userId}`, {
      method: 'PUT',
      reason: opts.reason,
      body: { delete_message_seconds: opts.deleteMessageSeconds ?? 0 },
    });
  }

  unban(guildId: string, userId: string, reason?: string) {
    return this.request(`/guilds/${guildId}/bans/${userId}`, { method: 'DELETE', reason });
  }

  kick(guildId: string, userId: string, reason?: string) {
    return this.request(`/guilds/${guildId}/members/${userId}`, { method: 'DELETE', reason });
  }

  /** Applies a communication timeout until the given ISO timestamp (or clears it with null). */
  timeout(guildId: string, userId: string, until: string | null, reason?: string) {
    return this.request(`/guilds/${guildId}/members/${userId}`, {
      method: 'PATCH',
      reason,
      body: { communication_disabled_until: until },
    });
  }

  addRole(guildId: string, userId: string, roleId: string, reason?: string) {
    return this.request(`/guilds/${guildId}/members/${userId}/roles/${roleId}`, {
      method: 'PUT',
      reason,
    });
  }

  removeRole(guildId: string, userId: string, roleId: string, reason?: string) {
    return this.request(`/guilds/${guildId}/members/${userId}/roles/${roleId}`, {
      method: 'DELETE',
      reason,
    });
  }

  setNickname(guildId: string, userId: string, nick: string | null, reason?: string) {
    return this.request(`/guilds/${guildId}/members/${userId}`, {
      method: 'PATCH',
      reason,
      body: { nick },
    });
  }

  setMemberRoles(guildId: string, userId: string, roles: string[], reason?: string) {
    return this.request(`/guilds/${guildId}/members/${userId}`, {
      method: 'PATCH',
      reason,
      body: { roles },
    });
  }

  // --- Messaging -------------------------------------------------------------

  deleteMessage(channelId: string, messageId: string, reason?: string) {
    return this.request(`/channels/${channelId}/messages/${messageId}`, {
      method: 'DELETE',
      reason,
    });
  }

  bulkDeleteMessages(channelId: string, messageIds: string[], reason?: string) {
    return this.request(`/channels/${channelId}/messages/bulk-delete`, {
      method: 'POST',
      reason,
      body: { messages: messageIds },
    });
  }

  listMessages(channelId: string, limit = 100) {
    return this.request<{ id: string; author: { id: string } }[]>(
      `/channels/${channelId}/messages`,
      { query: { limit } },
    );
  }

  sendMessage(channelId: string, payload: Record<string, unknown>) {
    return this.request<{ id: string }>(`/channels/${channelId}/messages`, {
      method: 'POST',
      body: payload,
    });
  }

  editMessage(channelId: string, messageId: string, payload: Record<string, unknown>) {
    return this.request<{ id: string }>(`/channels/${channelId}/messages/${messageId}`, {
      method: 'PATCH',
      body: payload,
    });
  }

  /** Opens a DM channel with a user and sends a message. Best-effort. */
  async sendDirectMessage(userId: string, payload: Record<string, unknown>): Promise<boolean> {
    try {
      const dm = await this.request<{ id: string }>('/users/@me/channels', {
        method: 'POST',
        body: { recipient_id: userId },
      });
      await this.sendMessage(dm.id, payload);
      return true;
    } catch {
      // Users can have DMs disabled — this is a soft failure.
      return false;
    }
  }

  // --- Channel management (emergency / utilities) ----------------------------

  setSlowmode(channelId: string, seconds: number, reason?: string) {
    return this.request(`/channels/${channelId}`, {
      method: 'PATCH',
      reason,
      body: { rate_limit_per_user: seconds },
    });
  }

  /** Overrides a role's SEND_MESSAGES permission in a channel (lock/unlock). */
  setChannelSendPermission(channelId: string, roleId: string, allow: boolean, reason?: string) {
    // type 0 = role overwrite. Deny SEND_MESSAGES to lock.
    return this.request(`/channels/${channelId}/permissions/${roleId}`, {
      method: 'PUT',
      reason,
      body: {
        type: 0,
        deny: allow ? '0' : SEND_MESSAGES.toString(),
        allow: '0',
      },
    });
  }

  // --- Invite URL ------------------------------------------------------------

  /**
   * Builds the bot invite URL. When `guildId` is provided, Discord pre-selects
   * that server so the admin can authorize the bot into the exact guild.
   */
  botInviteUrl(guildId?: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      scope: 'bot applications.commands',
      // Administrator (8) keeps setup simple; least-privilege can be refined later.
      permissions: '8',
    });
    if (guildId) {
      params.set('guild_id', guildId);
      params.set('disable_guild_select', 'true');
    }
    return `https://discord.com/oauth2/authorize?${params.toString()}`;
  }
}

/** Error thrown when a Discord REST call fails. */
export class DiscordApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly data?: unknown,
  ) {
    super(message);
    this.name = 'DiscordApiError';
  }
}
